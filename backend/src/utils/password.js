const bcryptjs = require("bcryptjs");

const SALT_ROUNDS = 10;

// Hash d'un mot de passe que personne ne connaît : quand le numéro est introuvable,
// on compare quand même avec lui pour que la réponse prenne le même temps
// (sinon la rapidité de la réponse révèle quels numéros sont inscrits)
const DUMMY_HASH = bcryptjs.hashSync("mot-de-passe-factice-jamais-utilise", SALT_ROUNDS);

const hashPassword = (password) => bcryptjs.hash(password, SALT_ROUNDS);

const verifyPassword = (password, passwordHash) => bcryptjs.compare(password, passwordHash || DUMMY_HASH);

module.exports = { hashPassword, verifyPassword };
