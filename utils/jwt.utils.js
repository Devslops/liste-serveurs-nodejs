var jwt = require('jsonwebtoken')

//Clef d'écriture token
const SECRET_KEY = '24mgnFzze40LKxh28545SDFDZSJ4E3p64rxygEU2WjjN9X4AERrGAEGzeze'

module.exports = {
    //Génère un token pour un uilisateur
    generateToken: (userData) => {
        //Ajouts des informations suivantes dans le token (signature de celui-ci)
        return jwt.sign({
            userId: userData.id,
            isAdmin: userData.isAdmin      
        },
        SECRET_KEY,
        {
            //Durée de validité du token
            expiresIn: '1h'
        })
    },
    //Supprimer le préfixe 'Bearer ' pour récupérer uniquement le token
    parseAuthorization: (authorization) => {
        return (authorization != null) ? authorization.replace('Bearer ', '') : null;
    },
    verifyToken: (req, res, next) => {
        const bearerHeader = req.headers['authorization'];
        //Check si bearer est défini
        if(typeof bearerHeader !== 'undefined') {
            //Formatage pour Obtenir le format : Bearer <access_token> (ajout de l'espace pour identifier le token dans la chaîne)
            const bearer = bearerHeader.split(' ')
            //Récupérer le token du header
            const bearerToken = bearer[1]

            //Récupère l'id du user par son token

            var userId = -1; //Token invalide
            if (bearerToken != null) {
                console.log("token ok")
                //Récupération des informations du token sous forme d'un objet
               let jwtToken = jwt.verify(bearerToken, SECRET_KEY, (err, decoded) => {
                    if(err) return err
                    console.log(decoded)
                    //Récupération de l'id du user via les infos du token
                    userId = decoded.userId
                    isAdmin = decoded.isAdmin
                    let userModel = {userId: userId, isAdmin: isAdmin} 
                    req.userInfo = userModel
                });
            }
            
        }         
        next();
    }
}