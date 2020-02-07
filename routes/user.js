let express = require('express')
var router = express.Router()
const jwtUtils = require('../utils/jwt.utils')
let validator = require("email-validator");
const sha256 = require('sha256')

let userModel = require('../models/users')

//Enregistrement de l'utilisateur
router.post('/user/register/', (req,res) => {
    var email = req.body.email;
    var name = req.body.name;
    var password = req.body.password;
    var isAdmin = req.body.isAdmin;

    if(email == null || name == null || password == null) {
        return res.status(400).json({'erreur': 'paramètres manquants'})
    }
    /*if(name.length >= 6 && name.length <= 16) {
        return res.status(400).json({'erreur': 'Taille du nom incorrecte'})
    }*/
    //Si l'email est valide
    if(validator.validate(email)) {
        
        userModel.findOne({ 
            email: true,
            "email":email
        })
        .then((userFound) => {
            //Utlisateur n'existe pas
            if (!userFound) {
                //Hash du mdp
                let hashedPassword = sha256(password)
                    let newUser = userModel.create({
                        email: email,
                        name: name,
                        isAdmin: isAdmin,
                        password: hashedPassword
                    })
                    .then(function(newUser) {
                        //Utilisateur créer
                        return res.status(201).json({
                            'userId': newUser.id
                        })
                    })
                    .catch((err) => {
                        return res.status(500).json({ 'erreur': "impossible d'ajouter l'utilisateur"})
                });
            } else {
                return res.status(409).json({'erreur': "l'utilisateur existe déjà"})
            }
        })
        .catch((err) => {
            return res.status(500).json({ 'erreur': "impossible de vérifier l'utilisateur"})
        });
        
    } else {
        return res.status(400).json({'erreur': 'email invalide'})
    }

});

router.post('/user/challenge', (req,res) => {
    let email = req.body.email
    let password = sha256(req.body.password)
    console.log(req.body)
    
    //Email et MDP non renseignées
    if(email == null || password == null) {
        return res.status(400).json({ 'erreur': 'paramètres manquants'})
    }

    userModel.findOne({
        "email": email
    })
    .then((user) => {
        console.log(user)
        if(user != null) {
            if(user.password === password)
                return res.status(500).send({ 'erreur': 'mot de passe incorrect'})

                let challenge = sha256(sha256(user.password + user.id + Date.now()))
                res.json({ challenge })

        } else {
            return res.status(404).send({ 'erreur': 'utilisateur introuvable'})
        }
    })

})

//Connexion de l'utilisateur
router.post('/user/login', (req,res) => {
    let response = req.body.response
    let email = req.body.email
    let challenge = req.body.challenge

    //Check existance user
    userModel.findOne({ 
        "email":email
    })
    .then((userFound) => {
        //Utilisateur existe
        if(userFound) {
            //Comparaison des 2 mdp hash
            let serverResponse = sha256(challenge + userFound.password + "alexis") 
            console.log("Réponse : "+serverResponse)
                if(serverResponse === response) {
                    //Retourne l'id et le token du user
                    return res.status(200).json({
                        'userId': userFound.id,
                        'token': jwtUtils.generateToken(userFound)
                    });
                } else {
                    return res.status(404).json({ 'erreur': "Données renseignées invalides"})
                }
        } else {
            return res.status(404).json({ 'erreur': "utilisateur n'existe pas"})
        }
    })
    .catch ((error) => {
        return res.status(500).json({ 'erreur': "impossible de connecter l'utilisateur"})
    });
});

//Récupérer les infos de l'utilisateur via le token
router.post('/user/myinfo', (req,res) => {

    //En-tête d'autorisation
    var headerAuth = req.headers['authorization']
    //Id du user via token
    var userInfo = jwtUtils.getUserInfo(headerAuth)

    //Si le token est invalide
    if(userInfo.userId < 0)
        return res.status(400).json({ 'erreur': 'Token invalide'})

    //Récupérer l'utilisateur via l'id user du token
    userModel.findOne({
        _id: userInfo.userId
    })
    .then((user) => {
        //Si l'utilisateur existe
        if(user) 
            res.status(201).json(user);
         else 
            res.status(404).json({'erreur': 'utilisateur introuvable'})
    })
})

//Formatage du token
//Autorisation : Bearer <access_token>

//Vérifier le token
function verifyToken(req, res, next) {
    //Récupérer le header de l'authentification
    const bearerHeader = req.headers['authorization'];
    //Check si bearer est défini
    if(typeof bearerHeader !== 'undefined') {
        //Formatage pour Obtenir le format : Bearer <access_token> (ajout de l'espace pour identifier le token dans la chaîne)
        const bearer = bearerHeader.split(' ')
        //Récupérer le token du header
        const bearerToken = bearer[1]
        //Ajout du token danq la requête pour les futurs requêtes
        req.token = bearerToken
        //Middleware suivant
        next();
    } else {
        //Refuse
        res.sendStatus(403);
    }

}

module.exports = router;