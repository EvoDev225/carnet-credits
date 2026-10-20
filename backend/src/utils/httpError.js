// Erreur "métier" à renvoyer telle quelle au client (404, 409…).
// Utile dans une transaction MongoDB : lever l'erreur annule la transaction,
// puis errorHandler transforme l'erreur en réponse.
class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.name = "HttpError";
        this.status = status;
    }
}

module.exports = HttpError;
