CREATE TABLE Students (
    student_id INT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    gender VARCHAR(10),
    contact VARCHAR(15),
    institution VARCHAR(100)
);

CREATE TABLE Rooms (
    room_number VARCHAR(10) PRIMARY KEY,
    room_type VARCHAR(20),
    capacity INT,
    is_occupied BOOLEAN DEFAULT FALSE
);

CREATE TABLE Allocations (
    allocation_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT,
    room_number VARCHAR(10),
    start_date DATE,
    end_date DATE,
    FOREIGN KEY (student_id) REFERENCES Students(student_id),
    FOREIGN KEY (room_number) REFERENCES Rooms(room_number)
);

CREATE TABLE Payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT,
    amount_paid DECIMAL(10,2),
    payment_date DATE,
    payment_method VARCHAR(50),
    FOREIGN KEY (student_id) REFERENCES Students(student_id)
);

CREATE TABLE MaintenanceRequests (
    request_id INT PRIMARY KEY AUTO_INCREMENT,
    room_number VARCHAR(10),
    issue_description TEXT,
    date_reported DATE,
    status VARCHAR(20),
    FOREIGN KEY (room_number) REFERENCES Rooms(room_number)
);sssssss