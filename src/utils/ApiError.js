
// /* <========== Error Handling ===============> */

// class ApiError extends Error {
//     constructor(statusCode,
//        message = "Something went wrong", 
//     errors = [], 
//     stack = "") {
       
//         super(message); // Call the super constructor of Error
//         this.statusCode = statusCode; // Set the statusCode property
//         this.message = message; // Set the message property
//         this.data = null;
//   this.success = false;
//   this.errors = errors

//   if (stack){
//     this.stack = stack}
//     else{
//    Error.captureStackTrace(this, this.constructor)
//   }

//     }
// }


// export { ApiError }


class ApiError extends Error {
    constructor(statusCode = 500, message = "Something went wrong", errors = [], stack = "") {
        super(message); // Call the super constructor of Error
        this.statusCode = statusCode; // Set the statusCode property
        this.data = null; // You can initialize additional properties here if needed
        this.success = false;
        this.errors = errors;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError };
