const db = require('../config/db');

// Add School API
const addSchool = (req, res) => {

    const {
        name,
        address,
        latitude,
        longitude
    } = req.body;

    // Validation
    if (
        !name ||
        !address ||
        latitude === undefined ||
        longitude === undefined
    ) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required'
        });
    }

     // Type validation
    if (
        typeof name !== 'string' ||
        typeof address !== 'string'
    ) {
        return res.status(400).json({
            success: false,
            message: 'Name and address must be strings'
        });
    }

    // Number validation
    if (
        isNaN(latitude) ||
        isNaN(longitude)
    ) {
        return res.status(400).json({
            success: false,
            message: 'Latitude and longitude must be numbers'
        });
    }

    // Latitude range validation
    if (latitude < -90 || latitude > 90) {
        return res.status(400).json({
            success: false,
            message: 'Latitude must be between -90 and 90'
        });
    }

    // Longitude range validation
    if (longitude < -180 || longitude > 180) {
        return res.status(400).json({
            success: false,
            message: 'Longitude must be between -180 and 180'
        });
    }

   const sql = `
        INSERT INTO schools (
            name,
            address,
            latitude,
            longitude
        )
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        
        sql,
        [name, address, latitude, longitude],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

           res.status(201).json({
                success: true,
                message: 'School added successfully',
                schoolId: result.insertId
            });
        }
    );
};

// Distance Formula
const calculateDistance = (
    lat1,
    lon1,
    lat2,
    lon2
) => {

    const toRadians = (degree) => {
        return degree * (Math.PI / 180);
    };

    const earthRadius = 6371;

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
    );

    return earthRadius * c;
};

// List Schools API
const listSchools = (req, res) => {

    const userLatitude = parseFloat(req.query.latitude);
    const userLongitude = parseFloat(req.query.longitude);

    // Validation
    if (

        isNaN(userLatitude) ||
        isNaN(userLongitude)
    ) {
        return res.status(400).json({
            success: false,
            message: 'Valid latitude and longitude are required'
        });
    }

    const sql = 'SELECT * FROM schools';
    db.query(sql, (err, schools) => {

        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        const schoolsWithDistance = schools.map((school) => {

            const distance = calculateDistance(
                userLatitude,
                userLongitude,
                school.latitude,
                school.longitude
            );

            return {
                ...school,
                distance: distance.toFixed(2) + ' km'
            };
        });

        // Sort nearest to farthest
        schoolsWithDistance.sort((a, b) => {
            return parseFloat(a.distance) - parseFloat(b.distance);
        });

        res.status(200).json({

            success: true,
            count: schoolsWithDistance.length,
            schools: schoolsWithDistance
        });
    });
};

module.exports = {
    addSchool,
    listSchools
};