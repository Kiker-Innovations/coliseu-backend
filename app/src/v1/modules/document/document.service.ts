import type { MongoClient } from "mongodb";
import { env } from "../../../config/env";
import type { CreateDocumentEntity } from "../../../database/mongodb/entity/document.entity";
import { DocumentRepository } from "../../../database/mongodb/repositories/document.repository";
import { ResidentRepository } from "../../../database/mongodb/repositories/resident.repository";
import { BuildingRepository } from "../../../database/mongodb/repositories/building.repository";
import { S3Provider } from "../../../providers/aws/s3.provider";
import type { DocumentCreateDto, DocumentUpdateDto } from "./dto";
import { httpException } from "../../../config/error";
import httpStatus from "http-status";
import type { HttpResponse } from "../../../interface/httpResponse.interface";
import { DocumentEmail } from "./document.emails";
import { ResidentStatusEnum } from "@/v1/enum/residentStatus.enum";

const ATTACHMENT_SIZE_LIMIT = 25 * 1024 * 1024; // 25MB

export class DocumentService {
  private documentRepository: DocumentRepository;
  private residentRepository: ResidentRepository;
  private buildingRepository: BuildingRepository;
  private s3Provider: S3Provider;

  constructor(mongoClient: MongoClient) {
    this.documentRepository = new DocumentRepository(mongoClient);
    this.residentRepository = new ResidentRepository(mongoClient);
    this.buildingRepository = new BuildingRepository(mongoClient);
    this.s3Provider = new S3Provider();
  }

  public async createDocument(documentCreateDto: DocumentCreateDto): Promise<
    HttpResponse<{
      _id: string;
      name: string;
      description: string;
      url: string;
      presignedUrl: string;
      createdAt: Date;
    }>
  > {
    const building = await this.buildingRepository.findById(
      documentCreateDto.buildingId
    );

    if (!building) {
      throw httpException("Edifício não encontrado", httpStatus.NOT_FOUND);
    }

    const documentId = crypto.randomUUID();
    const fileExtension = documentCreateDto.fileName
      .split(".")
      .pop()
      ?.toLowerCase();

    const { presignedUrl, publicUrl } = await this.generatePresignedUrl(
      documentCreateDto.buildingId,
      documentId,
      fileExtension || "pdf",
      documentCreateDto.mimeType
    );
    console.log('presignedUrl -------------------------------')
    console.log(presignedUrl)
    console.log('publicUrl -------------------------------')
    console.log(publicUrl)
    console.log('documentId -------------------------------')
    console.log(documentId)

    const documentEntity: CreateDocumentEntity = {
      buildingId: documentCreateDto.buildingId,
      name: documentCreateDto.name,
      description: documentCreateDto.description,
      url: publicUrl,
      fileName: documentCreateDto.fileName,
      fileSize: documentCreateDto.fileSize,
      mimeType: documentCreateDto.mimeType,
    };

    const createdDocument = await this.documentRepository.create(
      documentEntity
    );

    console.log('createdDocument -------------------------------')
    console.log(createdDocument)

    this.sendNotificationToResidentsAsync(
      documentCreateDto.buildingId,
      createdDocument.name,
      createdDocument.description,
      createdDocument.url,
      documentCreateDto.fileSize,
      documentCreateDto.fileName
    );

    return {
      success: true,
      message: "Documento criado com sucesso! Os moradores serão notificados.",
      data: {
        _id: createdDocument._id,
        name: createdDocument.name,
        description: createdDocument.description,
        url: createdDocument.url,
        presignedUrl,
        createdAt: createdDocument.createdAt,
      },
    };
  }

  public async getDocumentsByBuildingId(buildingId: string): Promise<
    HttpResponse<
      Array<{
        _id: string;
        name: string;
        description: string;
        url: string;
        fileName: string;
        fileSize: number;
        createdAt: Date;
      }>
    >
  > {
    const building = await this.buildingRepository.findById(buildingId);

    if (!building) {
      throw httpException("Edifício não encontrado", httpStatus.NOT_FOUND);
    }

    const documents = await this.documentRepository.findManyByBuildingId(
      buildingId
    );

    return {
      success: true,
      message: "Documentos encontrados com sucesso",
      data: documents.map((doc) => ({
        _id: doc._id,
        name: doc.name,
        description: doc.description,
        url: doc.url,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        createdAt: doc.createdAt,
      })),
    };
  }

  public async getDocumentById(documentId: string): Promise<
    HttpResponse<{
      _id: string;
      buildingId: string;
      name: string;
      description: string;
      url: string;
      fileName: string;
      fileSize: number;
      createdAt: Date;
    }>
  > {
    const document = await this.documentRepository.findById(documentId);

    if (!document) {
      throw httpException("Documento não encontrado", httpStatus.NOT_FOUND);
    }

    return {
      success: true,
      message: "Documento encontrado com sucesso",
      data: {
        _id: document._id,
        buildingId: document.buildingId,
        name: document.name,
        description: document.description,
        url: document.url,
        fileName: document.fileName,
        fileSize: document.fileSize,
        createdAt: document.createdAt,
      },
    };
  }

  public async updateDocument(
    documentId: string,
    documentUpdateDto: DocumentUpdateDto
  ): Promise<
    HttpResponse<{
      _id: string;
      name: string;
      description: string;
      url: string;
    }>
  > {
    const document = await this.documentRepository.findById(documentId);

    if (!document) {
      throw httpException("Documento não encontrado", httpStatus.NOT_FOUND);
    }

    const updatedDocument = await this.documentRepository.update(
      documentId,
      documentUpdateDto
    );

    if (!updatedDocument) {
      throw httpException(
        "Erro ao atualizar documento",
        httpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return {
      success: true,
      message: "Documento atualizado com sucesso",
      data: {
        _id: updatedDocument._id,
        name: updatedDocument.name,
        description: updatedDocument.description,
        url: updatedDocument.url,
      },
    };
  }

  public async deleteDocument(documentId: string): Promise<HttpResponse<null>> {
    const document = await this.documentRepository.findById(documentId);

    if (!document) {
      throw httpException("Documento não encontrado", httpStatus.NOT_FOUND);
    }

    const deleted = await this.documentRepository.delete(documentId);

    if (!deleted) {
      throw httpException(
        "Erro ao deletar documento",
        httpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return {
      success: true,
      message: "Documento deletado com sucesso",
      data: null,
    };
  }

  private async generatePresignedUrl(
    buildingId: string,
    documentId: string,
    fileExtension: string,
    mimeType: string
  ): Promise<{
    presignedUrl: string;
    s3Key: string;
    publicUrl: string;
  }> {
    const s3Key = `${env.providers.aws.s3.folders.documents}/${buildingId}/${documentId}.${fileExtension}`;

    const presignedUrl = await this.s3Provider.getPresignedUrlForPut(
      s3Key,
      mimeType,
      300 // 5 minutes
    );
    const publicUrl = this.s3Provider.getPublicUrl(s3Key);

    return {
      presignedUrl,
      publicUrl,
      s3Key,
    };
  }

  private async sendNotificationToResidentsAsync(
    buildingId: string,
    documentName: string,
    documentDescription: string,
    documentUrl: string,
    fileSize: number,
    fileName: string
  ): Promise<void> {
    try {
      const building = await this.buildingRepository.findById(buildingId);
      if (!building) {
        console.error(`❌ Building ${buildingId} not found for notification`);
        return;
      }

      const residents = await this.residentRepository.findMany({
        buildingId,
        status: ResidentStatusEnum.ATIVO,
      });

      if (residents.length === 0) {
        console.log(`ℹ️ No active residents found in building ${buildingId}`);
        return;
      }

      const documentEmail = new DocumentEmail();
      const canAttach = fileSize <= ATTACHMENT_SIZE_LIMIT;

      for (const resident of residents) {
        documentEmail.sendDocumentNotificationEmailAsync(
          resident.email,
          resident.name,
          building.name,
          documentName,
          documentDescription,
          documentUrl,
          canAttach,
          fileName
        );
      }

      console.log(
        `✅ Document notification sent to ${residents.length} residents`
      );
    } catch (error) {
      console.error(`❌ Error sending document notifications: ${error}`);
    }
  }
}
