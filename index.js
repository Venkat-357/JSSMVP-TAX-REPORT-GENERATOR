import express from 'express';
import bodyParser from 'body-parser';
import pg from 'pg';

const app = express();
const port = process.env.APP_PORT || 3000;

const db = new pg.Client({
    host : process.env.POSTGRES_HOST,
    database : process.env.POSTGRES_DATABASE,
    user : process.env.POSTGRES_USER,
    password : process.env.POSTGRES_PASSWORD,
    port : process.env.POSTGRES_PORT,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine","ejs");


// Create tables if they don't exist
db.query(`CREATE TABLE IF NOT EXISTS public.location (
            division_id integer PRIMARY KEY,
            division character varying(50) COLLATE pg_catalog."default",
            district character varying(50) COLLATE pg_catalog."default",
            taluk character varying(50) COLLATE pg_catalog."default",
            village_or_city character varying(50) COLLATE pg_catalog."default",
            khatha_or_property_no numeric NOT NULL UNIQUE
        )
`);
db.query(`CREATE TABLE IF NOT EXISTS public.payment_of_property_tax_details (
            pid_no SERIAL PRIMARY KEY,
            name_of_institution character varying(50) COLLATE pg_catalog."default",
            name_of_khathadar character varying(50) COLLATE pg_catalog."default",
            khatha_or_property_no integer, 
            dimension_of_vacant_area_in_sqft numeric,
            dimension_of_building_area_in_sqft numeric,
            total_dimension_in_sqft numeric,
            to_which_department_paid character varying(50) COLLATE pg_catalog."default",
            year_of_payment integer,
            receipt_no integer,
            property_tax numeric,
            rebate numeric,
            service_tax numeric,
            cesses numeric,
            interest numeric,
            penalty numeric,
            total_amount numeric,
            remarks character varying(100) COLLATE pg_catalog."default",
            CONSTRAINT fk_khatha_or_property_no FOREIGN KEY (khatha_or_property_no) REFERENCES public.location (khatha_or_property_no) ON DELETE CASCADE ON UPDATE CASCADE
        )
`);


app.get("/", async(req,res)=>{
    try {
        const query_result = await db.query("SELECT * FROM location JOIN payment_of_property_tax_details ON location.khatha_or_property_no = payment_of_property_tax_details.khatha_or_property_no ORDER BY location.khatha_or_property_no ASC");
        const information = query_result.rows;
        res.render("main.ejs", {
            information : information,
        });
    return;
    } catch(err) {
        res.send("the database is empty or some error occured");
    }
});

app.post("/new", async(req,res)=>{
    res.render("new_row.ejs");
});

app.post("/submit", async(req,res)=>{
    const division_id = req.body['division-id'];
    const division = req.body.division;
    const district = req.body.district;
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
        await db.query(`INSERT INTO payment_of_property_tax_details (name_of_institution, name_of_khathadar, khatha_or_property_no, dimension_of_vacant_area_in_sqft, dimension_of_building_area_in_sqft, total_dimension_in_sqft, to_which_department_paid, year_of_payment, receipt_no, property_tax, rebate, service_tax, cesses, interest, penalty, total_amount, remarks) 
                VALUES ('${institution_name}', '${khathadar_name}', ${khatha_no}, ${vacant_dimension}, ${building_dimension}, ${total_dimension}, '${department}', ${payment_year}, ${receipt_no}, ${property_tax}, ${rebate}, ${service_tax}, ${cesses}, ${interest}, ${penalty}, ${total_amount}, '${remarks}')`);
        console.log("The data was added successfully");
        res.redirect("/");
    } catch (err) {
        console.log(err);
    }
});


app.get("/modify",async(req,res)=>{
    let division_identification = req.query['division_id'];
    let khatha_identification = req.query['khatha_num'];
    const query_result = await db.query("SELECT * FROM location JOIN payment_of_property_tax_details ON location.khatha_or_property_no = payment_of_property_tax_details.khatha_or_property_no WHERE division_id = $1 AND location.khatha_or_property_no = $2 ",[division_identification,khatha_identification]);
    const retrieved_information = query_result.rows[0];
    if (!retrieved_information) {
        res.send("The data you are looking for is not available");
        return;
    } else {
        res.render("update_row.ejs",{
            retrieved_information : retrieved_information,
        });
    }
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
    
    try {
        await db.query(`UPDATE payment_of_property_tax_details 
                        SET name_of_institution='${institution_name}', 
                            name_of_khathadar='${khathadar_name}', 
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
                        WHERE khatha_or_property_no=${khatha_num}`);
        await db.query(`UPDATE location 
                        SET division='${division}', 
                            district='${district}', 
                            taluk='${taluk}', 
                            village_or_city='${city}' 
                        WHERE division_id=${division_id}`);
        
        console.log("The data was modified successfully");
        res.redirect("/");
    } catch (err) {
        console.log(err);
    }
});



app.listen(port,()=>{
    console.log(`The server is listening on the port ${port}`);
});