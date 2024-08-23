import express from 'express';
import bodyParser from 'body-parser';
import pg from 'pg';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 3000;
const db = new pg.Client({
    user : "postgres",
    host : "localhost",
    database : "JSSMVP",
    password : "July30@venkat",
    port : 5432,
});
db.connect();

const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine","ejs");


app.get("/", async(req,res)=>{
    try {
        const result01 = await db.query("SELECT * FROM location JOIN payment_of_property_tax_details ON location.khatha_or_property_no = payment_of_property_tax_details.khatha_or_property_no ORDER BY location.khatha_or_property_no ASC");
        const information = result01.rows;
        res.render("index01.ejs",{
        information : information,
        });
    return;
    } catch(err) {
        res.send("the database is empty");
    }
});

app.post("/new", async(req,res)=>{
    res.render("index02.ejs");
});

app.post("/submit", async(req,res)=>{
    const division_id = req.body['division-id'];
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
        await db.query("INSERT INTO location (division_id,division,district,taluk,village_or_city,khatha_or_property_no) VALUES ($1,$2,$3,$4,$5,$6)",[division_id,division,district,taluk,city,khatha_num]);
        await db.query("INSERT INTO payment_of_property_tax_details (name_of_institution,name_of_khathadar,khatha_or_property_no,pid_no,dimension_of_vacant_area_in_sqft,dimension_of_building_area_in_sqft,total_dimension_in_sqft,to_which_department_paid,year_of_payment,receipt_no,property_tax,rebate,service_tax,cesses,interest,penalty,total_amount,remarks) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)",[institution_name,khathadar_name,khatha_no,pid_num,vacant_dimension,building_dimension,total_dimension,department,payment_year,receipt_no,property_tax,rebate,service_tax,cesses,interest,penalty,total_amount,remarks]);
        console.log("the data added successfully");
        res.redirect("/");
    } catch (err) {
        console.log(err);
    }
});

app.post("/confirmation",async(req,res)=>{
    res.sendFile(__dirname+"/public/index01.html");
});

app.post("/modify",async(req,res)=>{
    let division_identification = req.body['division-id'];
    let khatha_identification = req.body['khatha-no'];
    const result02 = await db.query("SELECT * FROM location JOIN payment_of_property_tax_details ON location.khatha_or_property_no = payment_of_property_tax_details.khatha_or_property_no WHERE division_id = $1 AND location.khatha_or_property_no = $2 ",[division_identification,khatha_identification]);
    const retrieved_information = result02.rows[0];
    res.render("index03.ejs",{
        retrieved_information : retrieved_information,
    });
});

app.post("/edit",async(req,res)=>{
    const division_id = req.body['division-id'];
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
    
    await db.query("DELETE FROM location WHERE division_id = $1 AND khatha_or_property_no=$2",[division_id,khatha_num]);
    await db.query("DELETE FROM payment_of_property_tax_details WHERE khatha_or_property_no=$1",[khatha_num]);

    try {
        await db.query("INSERT INTO location (division_id,division,district,taluk,village_or_city,khatha_or_property_no) VALUES ($1,$2,$3,$4,$5,$6)",[division_id,division,district,taluk,city,khatha_num]);
        await db.query("INSERT INTO payment_of_property_tax_details (name_of_institution,name_of_khathadar,khatha_or_property_no,pid_no,dimension_of_vacant_area_in_sqft,dimension_of_building_area_in_sqft,total_dimension_in_sqft,to_which_department_paid,year_of_payment,receipt_no,property_tax,rebate,service_tax,cesses,interest,penalty,total_amount,remarks) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)",[institution_name,khathadar_name,khatha_no,pid_num,vacant_dimension,building_dimension,total_dimension,department,payment_year,receipt_no,property_tax,rebate,service_tax,cesses,interest,penalty,total_amount,remarks]);
        console.log("the data modified successfully");
        res.redirect("/");
    } catch (err) {
        console.log(err);
    }
});



app.listen(port,()=>{
    console.log(`the server is listening on the port ${port}`);
});