-- This file contains some dummy data for the database for testing purposes

INSERT INTO division_users (division_id, division, email, password, phone)
VALUES (1, 'Div1', 'johndoe2@example.com', 'JohnDoe2@', '1234567890'),
    (2, 'Div1', 'johndoe@example.com', 'JohnDoe123!', '9999999999');

INSERT INTO admins (email, password)
VALUES ('admin@admin', 'yolo');

INSERT INTO location (division_id, division, district, taluk, village_or_city, khatha_or_property_no) 
VALUES (1, 'Div', 'Mysuru', 'BLR', 'BLR', 1), 
(2, 'Div1', 'Mysuru', 'BLR', 'Dubai', 783704);

INSERT INTO payment_of_property_tax_details (sno, pid_no, name_of_institution, name_of_khathadar, khatha_or_property_no, dimension_of_vacant_area_in_sqft, dimension_of_building_area_in_sqft, total_dimension_in_sqft, to_which_department_paid, year_of_payment, receipt_no, property_tax, rebate, service_tax, cesses, interest, penalty, total_amount, remarks) VALUES (1, 2, 'JSS Science and Tech', 'Manju', 1, 1, 1, 1, 'KIADB', 2010, 1, 1, 1, 1, 1, 1, 1, 1, '1'), (2, 23, 'JSS PUBLIC SCHHOL', 'Vaibhav', 783704, 323, 9089, 9878, 'BBMP', 7897, 879, 89138, 13, 12321, 11, 1, 1, 1, 'Hii');

