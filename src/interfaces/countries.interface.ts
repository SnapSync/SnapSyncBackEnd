export interface Country {
    id: number;
    iso: string;
    name: string;
    nicename: string;
    iso3: string | null;
    numCode: number | null;
    phoneCode: number;

    flagUrl: string | null;
    flagPublicId: string | null;

    flagS3Key: string | null;

    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;

    unarchived: boolean;
}

export interface ApiCountry {
    id: number;
    iso: string;
    name: string;
    nicename: string;
    iso3: string | null;

    numCode: number | null;
    phoneCode: number;
    
    flagUrl: string | null;
}