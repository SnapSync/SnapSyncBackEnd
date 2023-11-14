export interface Device {
    id: number;
    uuid: string;
    brand: string | null;
    osName: string | null;
    osVersion: string | null;
    modelName: string | null;
    platformOs: string | null;

    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;

    unarchived: boolean;
}