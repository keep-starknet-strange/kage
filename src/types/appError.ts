export class AppError extends Error {
    readonly details: any | null;

    constructor(message: string, details: any | null = null) {
        super(message);
        this.details = details;
    }
}

export class CancellationError extends AppError {
    constructor() {
        super("Cancelled");
    }
}