export interface ApiErrorResponse{
    success: false,
    statusCode: number,
    error: string,
    message: string | string[],
    timestamp: string,
    path: string
}