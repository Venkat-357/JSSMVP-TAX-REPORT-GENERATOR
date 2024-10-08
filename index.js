import express from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';
import pg from 'pg';
import session from 'express-session';
import { validateEmail, validatePassword } from './utils/Validation.js';
import createTablesIfNotExists from './utils/CreateTables.js';
import {setAuthStatus} from './middleware/auth_wrap.js';

const app = express();
const port = process.env.APP_PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
// Creating the `public` folder as the static folder, allows our app to use the files in the `public` folder, like the JSS logo
app.use(express.static('public'))
app.use(
    session({
        secret: process.env.APP_SECRET,
        resave: false,
        saveUninitialized: false
    })
);
app.use(setAuthStatus); // This middleware will set the `isLoggedIn` and other variables in the response object
app.set("view engine","ejs");

// Configure Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for security
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed!'), false);
        }
    }
});

const db = new pg.Client({
    host : process.env.POSTGRES_HOST,
    database : process.env.POSTGRES_DATABASE,
    user : process.env.POSTGRES_USER,
    password : process.env.POSTGRES_PASSWORD,
    port : process.env.POSTGRES_PORT,
});

try {
    db.connect();
    console.log("Connected to the database");
} catch (err) {
    console.log("Failed to connect to the database");
    console.log(err);
}


// Create tables if they don't exist
createTablesIfNotExists(db);

// Register - Only for division-users for now. Admins can be added manually
app.get('/register', (req,res)=>{
    res.render("register.ejs");
});

// TODO: USE BCRYPT!!! PASSWORDS ARE STORED IN PLAIN TEXT!!
app.post('/register', async(req,res)=>{
    const email = req.body.email;
    const password = req.body.password;
    const phone = req.body.phone;
    const division_id = req.body['division-id'];
    const division = req.body.division;

    // Check if the email is valid
    if (!validateEmail(email)) {
        res.send("Please enter a valid email");
        return;
    }

    // Check if the email or division_id already exists
    let query_result = await db.query(`SELECT * FROM division_users WHERE email = '${email}'`);
    if (query_result.rows.length > 0) {
        res.send("The email already exists");
        return;
    }

    // Check if the division_id is a number
    if (isNaN(division_id)) {
        res.send("The division id should be a number");
        return;
    }

    query_result = await db.query(`SELECT * FROM division_users WHERE division_id = ${division_id}`);
    if (query_result.rows.length > 0) {
        res.send("The division id already exists");
        return;
    }

    // Check if division_name exists
    query_result = await db.query(`SELECT * FROM division_users WHERE division = '${division}'`);
    if (query_result.rows.length > 0) {
        res.send("The division name already exists");
        return;
    }

    // Check if the phone number is a number
    if (isNaN(phone)) {
        res.send("The phone number should be a number");
        return;
    }

    // Check if the password is valid
    if (!validatePassword(password)) {
        res.send("The password should be at least 8 characters long and contain at least one letter and one number");
        return;
    }

    try {
        await db.query(`INSERT INTO division_users VALUES (${division_id},'${division}','${email}','${password}',${phone})`);
        console.log("The data was added successfully");
        res.redirect("/login");
    } catch (err) {
        res.send(err);
    }
});

// Login methods - The same form is used for both admins and division users
// The login endpoint will automatically log in the user based on the type of user
app.get("/login", (req,res)=>{
    if (req.session.loggedin) {
        res.redirect("/");
    } else {
        res.render("login.ejs");
    }
});

app.post("/login", async(req,res)=>{
    const email = req.body.email;
    const password = req.body.password;
    // For admins
    let query_result = await db.query(`SELECT * FROM admins WHERE email = '${email}'`);
    if (query_result.rows.length > 0) {
        const user = query_result.rows[0];
        if (user.password === password) {
            req.session.loggedin = true;
            req.session.admin = true;
            req.session.division_user = false;
            req.session.user_details = {
                email : user.email,
                password : user.password,
            };
            res.redirect("/");
            return;
        } else {
            res.send("Invalid credentials");
            return;
        }
    }
    // For division users
    query_result = await db.query(`SELECT * FROM division_users WHERE email = '${email}'`);
    if (query_result.rows.length > 0) {
        const user = query_result.rows[0];
        if (user.password === password) {
            req.session.loggedin = true;
            req.session.division_user = true;
            req.session.admin = false;
            req.session.user_details = {
                division_id : user.division_id,
                division : user.division,
                email : user.email,
                password : user.password,
            };
            res.redirect("/");
        } else {
            res.send("Invalid credentials");
        }
    } else {
        res.send("Invalid credentials");
    }
});

// Logout
app.get("/logout", (req,res)=>{
    if (!req.session.loggedin) {
        res.redirect("/login");
        return;
    }
    req.session.loggedin = false;
    req.session.destroy((err) => {
        if (err) {
            return console.log(err);
        }
        res.redirect("/login")
        return;
    });
});


// Main page - Will display the data based on the type of user:
// - Admins will see all the data
// - Division users will see only the data from their division
app.get("/", async(req,res)=>{
    if (!req.session.loggedin) {
        res.redirect("/login");
    }
    // For admins
    if (req.session.admin) {
        try {
            const query_result = await db.query("SELECT * FROM location JOIN payment_of_property_tax_details ON location.khatha_or_property_no = payment_of_property_tax_details.khatha_or_property_no ORDER BY location.khatha_or_property_no ASC");
            const information = query_result.rows;
            res.render("main.ejs", {
                information : information,
                isAdmin : true,
            });
        return;
        } catch(err) {
            res.send("the database is empty or some error occured");
        }
    }
    // For division users
    if (req.session.division_user) {
        try {
            const query_result = await db.query(`SELECT * FROM location JOIN payment_of_property_tax_details ON location.khatha_or_property_no = payment_of_property_tax_details.khatha_or_property_no WHERE division_id = ${req.session.user_details.division_id} ORDER BY location.khatha_or_property_no ASC`);
            const information = query_result.rows;
            res.render("main.ejs", {
                information : information,
                isAdmin : false,
            });
            return;
        } catch(err) {
            res.send("the database is empty or some error occured");
        }
    }
});

// Get image
app.get('/image', async (req, res) => {
    try {
        const { sno } = req.query;
        if (isNaN(sno)) {
            res.status(400).send('Invalid image ID');
            return;
        }
        // Check if the user is allowed to access this image (belongs to the same division)
        if (req.session.division_user) {
            const query_result = await db.query(`SELECT location.division_id FROM location JOIN payment_of_property_tax_details ON location.khatha_or_property_no = payment_of_property_tax_details.khatha_or_property_no WHERE payment_of_property_tax_details.sno = $1`, [sno]);
            if (query_result.rows.length === 0) {
                res.status(404).send('Image not found');
                return;
            }
        }
        const img_query = await db.query('SELECT * FROM images WHERE sno = $1', [sno]);
        if (img_query.rows.length === 0) {
            res.status(404).send('Image not found');
            return;
        }
        const image = img_query.rows[0];
        res.set('Content-Type', image.filetype);
        res.send(image.data);
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred while retrieving the image.');
    }
});

// New entry - Only for division users
app.get("/new", async(req,res)=>{
    if (!req.session.loggedin) {
        res.redirect("/login");
        return;
    }
    // Admins can't make new entries
    if (req.session.admin) {
        res.send("You are not authorized to make new entries, please login as a division user");
        return;
    }
    try {
        res.render("new_row.ejs",{
            division_id : req.session.user_details.division_id,
            division : req.session.user_details.division,
        });
    } catch (err) {
        console.log(err);
        res.send(err);
    }
});


app.post("/new", upload.single('image'), async(req,res)=>{
    if (!req.session.loggedin) {
        res.redirect("/login");
    }
    if (req.session.admin) {
        res.send("You are not authorized to modify the data, please login as a division user");
        return
    }
    const division_id = req.body['division-id'];
    const division = req.body.division;
    const district = req.body.district;
    const pid_no = req.body['property-id'];
    const taluk = req.body.taluk;
    const city = req.body.city;
    const institution_name = req.body['institution-name'];
    const khathadar_name = req.body['khathadar-name'];
    const khatha_no = req.body['khatha-no'];
    const vacant_dimension = req.body['vacant-area'];
    const building_dimension = req.body['building-area'];
    const total_dimension = req.body['total-dimension'];
    const department = req.body.department;
    const payment_year = req.body['payment-year'];
    const receipt_no = req.body['receipt-no'];
    const property_tax = req.body['property-tax'];
    const rebate = req.body.rebate;
    const service_tax = req.body['service-tax'];
    const cesses = req.body.cesses;
    const interest = req.body.interest;
    const penalty = req.body.penalty;
    const total_amount = req.body['total-amount'];
    const remarks = req.body.remarks;

    try {
        await db.query(`INSERT INTO location VALUES (${division_id},'${division}','${district}','${taluk}','${city}',${khatha_no})`);
        let sno = await db.query(`INSERT INTO payment_of_property_tax_details (pid_no,name_of_institution, name_of_khathadar, khatha_or_property_no, dimension_of_vacant_area_in_sqft, dimension_of_building_area_in_sqft, total_dimension_in_sqft, to_which_department_paid, year_of_payment, receipt_no, property_tax, rebate, service_tax, cesses, interest, penalty, total_amount, remarks) 
                VALUES (${pid_no},'${institution_name}', '${khathadar_name}', ${khatha_no}, ${vacant_dimension}, ${building_dimension}, ${total_dimension}, '${department}', ${payment_year}, ${receipt_no}, ${property_tax}, ${rebate}, ${service_tax}, ${cesses}, ${interest}, ${penalty}, ${total_amount}, '${remarks}') RETURNING sno`);
        if (req.file) {
            const fileBuffer = req.file.buffer;
            const fileType = req.file.mimetype;
            const fileName = req.file.originalname;
            // Insert the image into the database
            await db.query(`INSERT INTO images (sno, data, filetype, filename) VALUES (${sno.rows[0].sno}, $1, $2, $3)`, [fileBuffer, fileType, fileName]);
        }
        console.log("The data was added successfully");
        res.redirect("/");
    } catch (err) {
        console.log(err);
    }
});


// Modify - Only for division users
// DivisionID and Khatha number are preinputted in the form from the user's details
app.get("/modify",async(req,res)=>{
    if (!req.session.loggedin) {
        res.redirect("/login");
        return;
    }
    if (req.session.admin) {
        res.send("You are not authorized to modify the data, please login as a division user");
        return
    }
    let division_identification = req.query['division_id'];
    let khatha_identification = req.query['khatha_num'];
    if (!division_identification || !khatha_identification) {
        res.send("The page you are looking for is not available");
        return;
    }
    // A division user can only modify the data of their division
    if (division_identification != req.session.user_details.division_id) {
        res.send("You are not authorized to modify this data");
        return;
    }
    const query_result = await db.query("SELECT * FROM location JOIN payment_of_property_tax_details ON location.khatha_or_property_no = payment_of_property_tax_details.khatha_or_property_no WHERE division_id = $1 AND location.khatha_or_property_no = $2 ",[division_identification,khatha_identification]);
    const retrieved_information = query_result.rows[0];
    if (!retrieved_information) {
        res.send("The data you are looking for is not available");
        return;
    }
    const image_query = await db.query("SELECT * FROM images WHERE sno = $1",[retrieved_information.sno]);
    if (!image_query.rows[0]) {
        res.render("update_row.ejs",{
            retrieved_information : retrieved_information,
            imgSrc : null,
        });
        return;
    }
    const image = image_query.rows[0];
    const base64Image = image.data.toString('base64');
    const imgSrc = `data:${image.filetype};base64,${base64Image}`;
    res.render("update_row.ejs",{
        retrieved_information : retrieved_information,
        imgSrc : imgSrc,
    });

});

app.post("/modify", upload.single('image'), async(req,res)=>{
    if (!req.session.loggedin) {
        res.redirect("/login");
    }
    if (req.session.admin) {
        res.send("You are not authorized to modify the data, please login as a division user");
        return;
    }
    const division_id = req.body['division-id'];
    if (division_id != req.session.user_details.division_id) {
        res.send("You are not authorized to modify this data");
        return;
    }
    const division = req.body.division;
    const district = req.body.district;
    const taluk = req.body.taluk;
    const city = req.body.city;
    const khatha_num = req.body['khatha-no'];
    const institution_name = req.body['institution-name'];
    const khathadar_name = req.body['khathadar-name'];
    const khatha_no = req.body['khatha-no'];
    const pid_num = req.body['property-id'];
    const vacant_dimension = req.body['vacant-area'];
    const building_dimension = req.body['building-area'];
    const total_dimension = req.body['total-dimension'];
    const department = req.body.department;
    const payment_year = req.body['payment-year'];
    const receipt_no = req.body['receipt-no'];
    const property_tax = req.body['property-tax'];
    const rebate = req.body.rebate;
    const service_tax = req.body['service-tax'];
    const cesses = req.body.cesses;
    const interest = req.body.interest;
    const penalty = req.body.penalty;
    const total_amount = req.body['total-amount'];
    const remarks = req.body.remarks;
    
    try {
        const sno = await db.query(`UPDATE payment_of_property_tax_details 
                        SET name_of_institution='${institution_name}', 
                            name_of_khathadar='${khathadar_name}', 
                            pid_no='${pid_num}',
                            dimension_of_vacant_area_in_sqft=${vacant_dimension}, 
                            dimension_of_building_area_in_sqft=${building_dimension}, 
                            total_dimension_in_sqft=${total_dimension}, 
                            to_which_department_paid='${department}', 
                            year_of_payment=${payment_year}, 
                            receipt_no=${receipt_no}, 
                            property_tax=${property_tax}, 
                            rebate=${rebate}, 
                            service_tax=${service_tax}, 
                            cesses=${cesses}, 
                            interest=${interest}, 
                            penalty=${penalty}, 
                            total_amount=${total_amount}, 
                            remarks='${remarks}' 
                        WHERE khatha_or_property_no=${khatha_num} RETURNING sno`);
        await db.query(`UPDATE location 
                        SET division='${division}', 
                            district='${district}', 
                            taluk='${taluk}', 
                            village_or_city='${city}' 
                        WHERE division_id=${division_id}`);
        if (req.file) {
            console.log("The file is present");
            const fileBuffer = req.file.buffer;
            const fileType = req.file.mimetype;
            const fileName = req.file.originalname;
            // Check if an image already exists with this record
            try {
                const image_query = await db.query(`SELECT * FROM images WHERE sno=$1`, [sno.rows[0].sno]);
                // If it does, update the image
                if (image_query.rows[0]) {
                    await db.query(`UPDATE images 
                        SET data=$1, filetype=$2, filename=$3 
                        WHERE sno=$4`, [fileBuffer, fileType, fileName, sno.rows[0].sno]);
                } else {
                    // Otherwise, insert a new image
                    console.log("The image does not exist, creating a new one");
                    await db.query(`INSERT INTO images (sno, data, filetype, filename) VALUES ($1, $2, $3, $4)`, [sno.rows[0].sno, fileBuffer, fileType, fileName]);
                }
            } catch (err) {
                console.log("The image was not updated");
            }
        }
        console.log("The data was modified successfully");
        res.redirect("/");
    } catch (err) {
        console.log("the data is not modified successfully");
    }
});

app.get("/delete",async(req,res)=>{
    if (!req.session.loggedin) {
        res.redirect("/login");
    }
    if (req.session.admin) {
        res.send("You are not authorized to modify data, please login as a division user");
        return;
    }
    let division_id = req.query['division_id'];
    let khatha_num = req.query['khatha_num'];
    if (!division_id || !khatha_num) {
        res.send("The page you are looking for is not available");
        return;
    } else {
        res.render("delete.ejs",{
            division_id : division_id,
            khatha_num : khatha_num,
        });
    }
});

app.post("/delete", async(req,res)=>{
    if (!req.session.loggedin) {
        res.redirect("/login");
    }
    if (req.session.admin) {
        res.send("You are not authorized to modify data, please login as a division user");
        return;
    }
    let division_id = req.body['division_id'];
    let khatha_num = req.body['khatha_no'];
    try {
        const sno = await db.query("DELETE FROM payment_of_property_tax_details WHERE khatha_or_property_no = $1 RETURNING sno",[khatha_num]);
        await db.query("DELETE FROM location WHERE khatha_or_property_no = $1",[division_id]);
        await db.query("DELETE FROM images WHERE sno = $1",[sno.rows[0].sno]);
        res.redirect("/");
        return;
    } catch (error) {
        console.log(error);
        console.log('the data was not deleted');
        res.send("The data was not deleted");
        return;
    }
});


app.get("/comprehensive-report",async(req,res)=>{
    if (!req.session.loggedin) {
        res.redirect("/login");
    }
    if (req.session.admin) {
        let query_result = await db.query("SELECT * FROM location JOIN payment_of_property_tax_details ON location.khatha_or_property_no = payment_of_property_tax_details.khatha_or_property_no");
        let data = query_result.rows;
        res.render("comprehensive_report.ejs",{
            data : data,
        });
        return;
    }
    if (req.session.division_user) {
        let query_result = await db.query("SELECT * FROM location JOIN payment_of_property_tax_details ON location.khatha_or_property_no = payment_of_property_tax_details.khatha_or_property_no WHERE division_id = $1",[req.session.user_details.division_id]);
        let data = query_result.rows;
        res.render("comprehensive_report.ejs",{
            data : data,
        });
        return;
    }
    res.send("The page you are looking for is not available");
});


app.get("/local-report",async(req,res)=>{
    if (!req.session.loggedin) {
        res.redirect("/login");
    }
    if (req.session.admin) {
        let query_result = await db.query("SELECT pid_no,name_of_institution,name_of_khathadar,khatha_or_property_no FROM payment_of_property_tax_details");
        let data = query_result.rows;
        res.render("local_report.ejs",{
            data : data,
        });
        return;
    }
    if (req.session.division_user) {
        let query_result = await db.query("SELECT pid_no,name_of_institution,name_of_khathadar,location.khatha_or_property_no FROM location JOIN payment_of_property_tax_details ON location.khatha_or_property_no = payment_of_property_tax_details.khatha_or_property_no WHERE division_id = $1",[req.session.user_details.division_id]);
        let data = query_result.rows;
        res.render("local_report.ejs",{
            data : data,
        });
        return;
    }
    res.send("The page you are looking for is not available");
});


app.listen(port,()=>{
    console.log(`The server is listening on the port ${port}`);
});