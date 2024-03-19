class ApiResponse {
    constructor(statusCode, data, message = "Success") {
        if (typeof statusCode !== 'number') {
            throw new Error('Status code must be a number');
        }

        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = this.statusCode < 400;
    }
}

export { ApiResponse };
