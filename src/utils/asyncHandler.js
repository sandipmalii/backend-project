

/* <========== PROMISE WRAPPER ================> */
/* <========== WAY-1 ===============> */

// asyncHandler middleware function to handle asynchronous request handlers
const asyncHandler = (requestHandler) => {
    // Return a middleware function to handle the request
    return (req, res, next) => {
        // Wrap the request handler in a Promise to handle asynchronous operations
        Promise.resolve(requestHandler(req, res, next))
            // Catch any errors that occur during asynchronous processing
            .catch(err => next(err)); // Pass the error to the Express error handling middleware
    };
};

// Export the asyncHandler function for use in other modules
export { asyncHandler };


/* <========== TRY, CATCH WRAPPER fun ===============> */
/* <========== WAY-2 ===============> */

// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next);
//     } catch (error) {
//         res.status(error.code || 500).json({ success: false, message: error.message });
//     }
// };

