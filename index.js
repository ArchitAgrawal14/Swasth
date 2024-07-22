import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "Swasth",
    password: "SdvhiyFHp345#",
    port: 4000,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.render("index.ejs");
});

app.get("/login", (req, res) => {
    res.render("login.ejs");
});
app.post("/SignUp",async(req,res)=>{
    const user_SignUp_FullName=req.body["FullName"];
    const user_SignUp_Email=req.body["SignUp_Email"];
    const user_SignUp_Password=req.body["SignUp_Password"];
    const user_SignUp_Mobile_number=req.body["Mobile_number"];
    try {
         await db.query("INSERT INTO users_data (full_name,email,password,mobile_number) VALUES ($1,$2,$3,$4)",[user_SignUp_FullName,user_SignUp_Email,user_SignUp_Password,user_SignUp_Mobile_number]);
         res.render("index.ejs",{
            name:user_SignUp_FullName,
         })
    } catch (error) {
        console.error("Couldn't register user", error);
        res.status(500).send("Internal server error");
    }
})
app.post("/SignUp", async (req, res) => {
    const FullName = req.body["FullName"];
    const SignUp_Email = req.body["SignUp_Email"];
    const SignUp_Password = req.body["SignUp_Password"];
    const Mobile_number = req.body["Mobile_number"];

    try {
        const numberChecking = await db.query(
            "SELECT mobile_number FROM users_data WHERE mobile_number = $1;",
            [Mobile_number]
        );

        if (numberChecking.rows.length != 0) {
            res.render("login.ejs", { error: "Mobile number already exists. Please login." });
        } else {
            try {
                await db.query(
                    "INSERT INTO users_data (full_name, email, password, mobile_number) VALUES ($1, $2, $3, $4)",
                    [FullName, SignUp_Email, SignUp_Password, Mobile_number]
                );

                res.redirect("/", { name: FullName });
            } catch (error) {
                console.log("Signup error occurred: " + error);
                res.status(500).send("Error during sign up.");
            }
        }
    } catch (error) {
        console.log("Error during mobile number checking: " + error);
        res.status(400).send("Mobile number already exists, kindly login.");
    }
});
app.post("/Login",async(req,res)=>{
    const user_name=req.body["Email"];
    const user_password=req.body["Password"];
    try {
        const user_login=await db.query("SELECT * FROM users_data WHERE email=$1 AND password=$2",[user_name,user_password]);
        if (user_login.rows.length === 0) {
            res.status(401).send("Invalid email or password");
        } else {
            console.log("User found");
            res.render("index.ejs", {
                name: user_login.rows[0].full_name,
            });
        } 
    } catch (error) {
        console.error("Error during login", error);
        res.status(500).send("Internal server error");
    }
})


app.post("/Login", async (req, res) => {
    const Email = req.body["Email"];
    const Password = req.body["Password"];

    try {
        const user_login = await db.query(
            "SELECT * FROM users_data WHERE email = $1 AND password = $2",
            [Email, Password]
        );

        if (user_login.rows.length > 0) {
            const name = user_login.rows[0];
            res.render("index.ejs", { name: name.full_name });
        } else {
            res.status(401).send("Invalid email or password.");
        }
    } catch (error) {
        console.log("Login error: " + error);
        res.status(500).send("Error during login.");
    }
});
app.get("/vaccines", async(req, res) => {
    try {
        const { rows: Vac_data }=await db.query("SELECT * FROM public.vaccines")
        res.render("Vaccines.ejs",{Vac_data});    
    } catch (error) {
        console.error("Error fetching vaccines data:", error);
        res.status(500).send("Internal Server Error");
    
    }
    
});

app.get("/ayurveda", async(req, res) => {
    try {
        const { rows: Ayur_data } = await db.query("SELECT * FROM public.ayurveda");
        res.render("Ayurveda.ejs", { Ayur_data });
    } catch (error) {
        console.error("Error fetching doctor data:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/doctors", async (req, res) => {
    try {
        const { rows: Doc_data } = await db.query("SELECT * FROM public.doctors");
        res.render("Doctors.ejs", { Doc_data });
    } catch (error) {
        console.error("Error fetching doctor data:", error);
        res.status(500).send("Internal Server Error");
    }
});


app.get("/custom_plan", (req, res) => {
    res.render("Custom_plan.ejs");
});

app.post("/customPlan", async (req, res) => {
    const Weight_in_Kg = req.body["Weight_in_Kg"];
    const Height_in_cm = req.body["Height_in_cm"];
    const Disease = req.body["Disease"].trim().toLowerCase();

    if (!isValidNumber(Weight_in_Kg) || !isValidNumber(Height_in_cm)) {
        return res.render("Custom_plan.ejs", { error: "Invalid weight or height entry" });
    }

    try {
        const diseaseCheck = await db.query(
            "SELECT id, disease_name FROM disease WHERE LOWER(disease_name) LIKE '%' || $1 || '%';",
            [Disease]
        );

        if (diseaseCheck.rows.length > 0) {
            const diseaseId = diseaseCheck.rows[0].id;
            console.log("Disease found: " + diseaseCheck.rows[0].disease_name);
            const userId = req.body["user_id"];
            await db.query(
                "UPDATE users_data SET disease_id = $1 WHERE id = $2",
                [diseaseId, userId]
            );

            console.log(`User ID ${userId} associated with Disease ID ${diseaseId}`);
        } else {
            console.log("Did not find the disease");
        }

        res.render("Custom_plan1.ejs");
    } catch (error) {
        console.log("Error during disease check or user update: " + error);
        res.status(500).send("Error during custom plan creation.");
    }
});
app.post('/vataPittaKapha', async(req, res) => {
    const selectedIntValues=Object.values(req.body).map(val=>parseInt(val));
    let sum=0;
    let characterUsedA=0;
    let characterUsedB=0;
    let characterUsedC=0;
    for(let totalOfValue of selectedIntValues){
        if(totalOfValue === 1){
            characterUsedA++;
        }else if(totalOfValue === 2){
            characterUsedB++;
        }else{
            characterUsedC++;
        }
        sum += totalOfValue;
    }
    console.log(sum);
    console.log("A is " + characterUsedA)
    console.log("B is " + characterUsedB)
    console.log("C is " + characterUsedC)
    try {
        let dosha_data;
        const result  = await db.query("SELECT * FROM public.dosha");
        
        if(characterUsedA > characterUsedB ){
            if( characterUsedA > characterUsedC){
            dosha_data=result.rows.map(row => row.vata);
        }else {
            dosha_data=result.rows.map(row => row.kapha);
        }
        }else if(characterUsedA > characterUsedC){
            dosha_data=result.rows.map(row => row.pitta);    
        }else if(characterUsedB > characterUsedC){
            dosha_data=result.rows.map(row => row.pitta);
        }else{
            dosha_data=result.rows.map(row => row.kapha);
        }
        res.render("Custom_plan2.ejs",{dosha_data});
    } catch (error) {
        console.error("Error fetching doctor data:", error);
        res.status(500).send("Internal Server Error");
    }
});
app.get("/yoga", async(req, res) => {
    try {
        const { rows: yog_data } = await db.query("SELECT * FROM public.yoga");
        res.render("yoga.ejs", { yog_data });
    } catch (error) {
        console.error("Error fetching doctor data:", error);
        res.status(500).send("Internal Server Error");
    }
    
});

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});

function isValidNumber(val) {
    return /^\d+$/.test(val);
}
