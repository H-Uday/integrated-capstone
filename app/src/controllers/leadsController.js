// const {db} = require('../config/database');

// function createLead(req, res) {
//     const {
//         customer_id, vehicle_id, enquiry_date, status, dealer_name, state, notes
//     } = req.body;

//     try {

//         const customer = db.prepare(
//             'SELECT customer_id FROM customers WHERE customer_id = ?'
//         ).get(Number(customer_id));

//         if (!customer) {
//             return res.status(400).json({
//                 success: false,
//                 error: `Customer ID ${customer_id} not found`
//             });
//         }

//         const vehicle = db.prepare(
//             'SELECT vehicle_id FROM vehicles WHERE vehicle_id = ?'
//         ).get(Number(vehicle_id));

//         if (!vehicle) {
//             return res.status(400).json({
//                 success: false,
//                 error: `Vehicle ID ${vehicle_id} not found`
//             })
//         }

//         const stmt = db.prepare(`
//             INSERT INTO Leads
//                 (customer_id, vehicle_id, enquiry_date, status, dealer_name, state, notes)
//             VALUES (?, ?, ?, ?, ?, ?, ?)
//         `);

//         const result = stmt.run(
//   Number(customer_id),
//   Number(vehicle_id),
//   enquiry_date,
//   status,
//   dealer_name ? dealer_name.trim() : null,
//   state.trim(),
//   notes ? notes.trim() : null
// );

//         return res.status(201).json({
//             success: true,
//             message: 'Lead created successfully',
//             lead_id: result.lastInsertRowid
//         });

//     } catch (err) {
//         console.error('createLead error:', err.message);
//         return res.status(500).json({
//             success: false,
//             error: 'Internal server error'
//         });
//     }
// }

// function getLeadsByCustomer(req, res) {
//     const { customerId } = req.params;

//     if (!customerId || isNaN(Number(customerId))) {
//         return res.status(400).json({
//             success: false,
//             error: 'customerId must be a number'
//         });
//     }

//     try {
//         const leads = db.prepare(`
//             SELECT 
//             l.*,
//             v.make, v.model, v.variant, v.price_local, v.segment, v.fuel_type
//             FROM leads l
//             JOIN vehicles v ON l.vehicle_id = v.vehicle_id
//             WHERE l.customer_id = ?
//             ORDER BY l.enquiry_date DESC
//         `).all(Number(customerId));

//         return res.status(200).json({
//             success: true,
//             count: leads.length,
//             data: leads
//         });
//     } catch (err) {
//         console.error('getLeadsByCustomer error:', err.message);
//         return res.status(500).json({
//             success: false,
//             error: 'Internal server error'
//         });
//     }
// } 

// function getLeadCount(req, res) {
//   try {
//     const result = db.prepare('SELECT COUNT(*) as count FROM leads').get();
//     return res.status(200).json({ success: true, count: result.count });
//   } catch (err) {
//     console.error('getLeadCount error:', err.message);
//     return res.status(500).json({ success: false, error: 'Internal server error' });
//   }
// }

// module.exports = { createLead, getLeadsByCustomer, getLeadCount };

const { db } = require('../config/database');

function createLead(req, res) {
    const {
        customer_id, vehicle_id, enquiry_date, status, dealer_name, state, notes
    } = req.body;

    try {

        const customer = db.prepare(
            'SELECT customer_id FROM customers WHERE customer_id = ?'
        ).get(Number(customer_id));

        if (!customer) {
            return res.status(400).json({
                success: false,
                error: `Customer ID ${customer_id} not found`
            });
        }

        const vehicle = db.prepare(
            'SELECT vehicle_id FROM vehicles WHERE vehicle_id = ?'
        ).get(Number(vehicle_id));

        if (!vehicle) {
            return res.status(400).json({
                success: false,
                error: `Vehicle ID ${vehicle_id} not found`
            });
        }

        const stmt = db.prepare(`
            INSERT INTO Leads
                (customer_id, vehicle_id, enquiry_date, status, dealer_name, state, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            Number(customer_id),
            Number(vehicle_id),
            enquiry_date,
            status,
            dealer_name ? dealer_name.trim() : null,
            state.trim(),
            notes ? notes.trim() : null
        );

        // ✅ Emit real-time event to all connected WebSocket clients
        const io = req.app.get('io');
        if (io) {
            io.emit('new_lead', {
                lead_id:       result.lastInsertRowid,
                customer_id:   Number(customer_id),
                vehicle_id:    Number(vehicle_id),
                status:        status,
                dealer_name:   dealer_name ? dealer_name.trim() : null,
                state:         state.trim(),
                enquiry_date:  enquiry_date,
                timestamp:     new Date().toISOString(),
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Lead created successfully',
            lead_id: result.lastInsertRowid
        });

    } catch (err) {
        console.error('createLead error:', err.message);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}

function getLeadsByCustomer(req, res) {
    const { customerId } = req.params;

    if (!customerId || isNaN(Number(customerId))) {
        return res.status(400).json({
            success: false,
            error: 'customerId must be a number'
        });
    }

    try {
        const leads = db.prepare(`
            SELECT 
            l.*,
            v.make, v.model, v.variant, v.price_local, v.segment, v.fuel_type
            FROM leads l
            JOIN vehicles v ON l.vehicle_id = v.vehicle_id
            WHERE l.customer_id = ?
            ORDER BY l.enquiry_date DESC
        `).all(Number(customerId));

        return res.status(200).json({
            success: true,
            count: leads.length,
            data: leads
        });
    } catch (err) {
        console.error('getLeadsByCustomer error:', err.message);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
} 

function getLeadCount(req, res) {
    try {
        const result = db.prepare('SELECT COUNT(*) as count FROM leads').get();
        return res.status(200).json({ success: true, count: result.count });
    } catch (err) {
        console.error('getLeadCount error:', err.message);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

module.exports = { createLead, getLeadsByCustomer, getLeadCount };