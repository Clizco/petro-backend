import {Router } from "express";
import { validateCreate } from "../../validators/users.js";
import { pool } from "../../db.js";
import jwt from "jsonwebtoken";
import config from "../../config.js"
import bcrypt from "bcrypt"
import { jwtDecode } from "jwt-decode";

const userRouter = Router()

// middleware that logs the IP
userRouter.use((req, res, next) => {
    console.log(req.ip) 
    next(); 
})


//se encarga de traer un usuario atraves de un correo
userRouter.get("/:email", async (req, res) => {
    try{
        const user = req.params.email;

        const [results] = await pool.query("SELECT * FROM users WHERE user_email = ?", [user] )
    
        return res.status(200).json(results)

    } catch (error){
        console.error(error)
    }
    

})



//se encarga de traer todos los usuarios en la base de datos
userRouter.get("/users/all", async (req, res) => {
    try {
      const [rows] = await pool.query("SELECT * FROM users");
      console.log("Datos obtenidos:", rows);
      return res.status(200).json(rows);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      return res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

// se encarga de traer un usuario atraves de un id
userRouter.get("/users/:id", async (req, res) => {
    try {
        const user = req.params.id;
        const [results] = await pool.query("SELECT * FROM users WHERE id = ?", [user]);

        if (results.length > 0) {
            return res.status(200).json(results[0]);
        } else {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error del servidor" });
    }
});



//se encarga de crear los usuarios
userRouter.post("/signup/", validateCreate, async (req, res) => {
        try {
            const { user_firstname, user_lastname, user_email, role_id, user_password, user_phonenumber } = req.body;
    
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(user_password, salt);
    
            const newUser = { 
                user_firstname,
                user_lastname,
                user_email, 
                user_password: hash,
                user_phonenumber,
                role_id
                
            };  
    
            if (!newUser.user_email || !newUser.user_password ) {
                return res.status(401).send("Por favor ingrese todos los datos del usuario");
            }
    
            const result = await pool.query("INSERT INTO users SET ?", [newUser]);
            
            const token = jwt.sign({ id: result.insertId }, config.secret, {
                expiresIn: 60 * 60 * 24
            });
    
            res.json({ auth: true, result, token }); 
        } catch (error) {
            console.error(error);
            res.status(500).send(error.message);
        }
    });



//inicio de sesion de los usuarios --- 100%
userRouter.post("/signin/", async (req, res) => {
    try {
        const email = req.body.user_email;
        const password = req.body.user_password;
        const query = "SELECT * FROM users WHERE user_email = ?";
        const [currentUser] = await pool.query(query, [email]);
        const user = currentUser[0];

        if (!email) {
            res.status(401).send("Falta el correo !!");
        } else if (!password) {
            res.status(401).send("Falta la contrasena !!");
        } else if (!user) {
            res.status(401).send("El usuario no se encuentra registrado, porfavor registrese");
        } else {
            const result = bcrypt.compareSync(password, user.user_password);
            if (!result) {
                res.status(401).send({ auth: result, message: "La contrasena es incorrecta, porfavor verificala" });
            } else {
                const token = jwt.sign({ id: user.id,
                                         email: user.user_email  }, config.secret, { expiresIn: 60 * 60 * 24 });
                
                
                var decode = jwtDecode(token)
                res.json({ auth: result, message: `Contrasena correcta, bienvenido ${email} `, token, decode});
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Error interno del servidor");
        
    }
});


userRouter.get("/users/token", async (req, res) => {
    const token = req.headers['x-access-token'];

    if (!token) {
        return res.status(401).json({
            auth: false,
            message: 'No token provided'
        });
    }

    try {
        const decoded = jwt.verify(token, config.secret);

    
        const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [decoded.id]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'No user found'
            });
        }

        const user = rows[0];
        delete user.password;

        res.json(user);
    } catch (err) {
        return res.status(500).json({
            auth: false,
            message: 'Failed to authenticate token.'
        });
    }
});


//Saber cual es el rol del usuario
userRouter.get("/users/role/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Consulta para obtener el nombre del rol junto con el ID del rol
        const [rows] = await pool.query(
            `SELECT roles.role_name 
             FROM users 
             JOIN roles ON users.role_id = roles.id 
             WHERE users.id = ?`, 
            [id]
        );

        // Verificar si se encontró un usuario con el ID dado
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const userRole = rows[0].role_name;
        console.log("Rol del usuario:", userRole);

        // Verificar si el rol es "administrador" o "usuario"
        if (userRole === 'admin' || userRole === 'user') {
            // Si es administrador o usuario, proceder
            return res.status(200).json({ message: 'Acceso permitido', role: userRole });
        } else {
            // Si el rol no es permitido
            return res.status(403).json({ error: 'Acceso denegado' });
        }
    } catch (error) {
        console.error("Error al obtener el rol del usuario:", error);
        return res.status(500).json({ error: 'Error al obtener el rol del usuario' });
    }
});



//actualizacion de los datos de un usuario
userRouter.post("/users/update/:id", async(req, res) => {
    try {

        const { id } = req.params;

        
        bcrypt.genSalt(10, function(err, salt){
            bcrypt.hash(req.body.user_password, salt, function(err, hash){

                const newusers = ({ 
                    "user_firstname":req.body.user_firstname,
                    "user_lastname":req.body.user_lastname, 
                    "user_email":req.body.user_email, 
                    "user_phonenumber":req.body.user_phonenumber ,
                    "role_id":req.body.role_id 
                    })

                
                if (!newusers){
                        res.status(401).send("Por favor ingrese todos los datos del usuario")
                }
        
                const result = pool.query("UPDATE users set ? WHERE id = ?", [newusers, id])
        
                res.json({updated: true, result}); 
                
            });
        });

    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
})


// delete users
userRouter.delete("/delete/:id", async(req, res) => {
    try{

        const User = req.params.id;

        const result = await pool.query("DELETE FROM users WHERE id = ?", [User]);
        
        res.json(result)

    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
})

//delete users with email
userRouter.delete("/delete/:email", async(req, res) => {
    try{

        const User = req.params.email;

        const result = await pool.query("DELETE FROM users WHERE user_email = ?", [User]);
        
        res.json(result)

    } catch (error) {
        res.status(500);
        res.send(error.message);
    }
})

export default userRouter;




