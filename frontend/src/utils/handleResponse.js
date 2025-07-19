// frontend/src/utils/handleResponse.js

/**
 * Handles API responses, checking for success and parsing JSON data.
 * Throws an error if the response is not OK or if there's an issue parsing.
 * @param {Response} response - The fetch API Response object.
 * @returns {Promise<any>} - A promise that resolves with the parsed JSON data.
 * @throws {Error} - Throws an error with a message if the response is not successful.
 */
const handleResponse = async (response) => {
    // If the response is not OK (e.g., 4xx or 5xx status code)
    if (!response.ok) {
        let errorData;
        try {
            // Attempt to parse error message from JSON response body
            errorData = await response.json();
        } catch (e) {
            // If response body is not JSON, use status text
            errorData = { message: response.statusText || 'Something went wrong.' };
        }

        // Create a new Error object with a specific message
        const error = new Error(errorData.message || 'API request failed.');
        error.status = response.status;
        error.data = errorData; // Attach full error data for more context if needed
        throw error;
    }

    // If the response is OK, parse the JSON body
    // Check if the response has content before trying to parse as JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    } else {
        // If not JSON, return response text or an empty object
        // This can happen for e.g. a successful DELETE request with no content
        return {};
    }
};

export default handleResponse;