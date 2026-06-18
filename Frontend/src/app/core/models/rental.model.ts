export interface RentalRequestDto {
    postId: number;
    message: string;
    desiredStart: string;
    desiredEnd: string;
}

export interface RentalRequestResponse {
    id: number;
    postId: number;
    buyerId: number;
    message: string;
    desiredStart: string;
    desiredEnd: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    createdAt: string;
}

export interface RentalContractResponse {
    id: number;
    postId: number;
    tenantId: number;
    startDate: string;
    endDate: string;
    monthlyPrice: number;
    status: 'ACTIVE' | 'TERMINATED';
    createdAt: string;
}