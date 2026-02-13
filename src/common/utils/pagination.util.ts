export interface PaginationParams {
    page?: number;
    limit?: number;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export function getPaginationParams(page = 1, limit = 10): { skip: number; take: number } {
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100);

    return {
        skip: (validPage - 1) * validLimit,
        take: validLimit,
    };
}

export function createPaginationMeta(
    page: number,
    limit: number,
    total: number,
): PaginationMeta {
    return {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    };
}
