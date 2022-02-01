const { getCustomerById, getCustomersList } = require('../../providers/customers');

const crmCallbackHandler = async (req, res) => {
    const location = req.body.Location;
    // Location helps to determine which information was requested.
    // CRM callback is a general purpose tool and might be used to fetch different kind of information

    switch (location) {
        case 'GetCustomerDetailsByCustomerId': {
            await handleGetCustomerDetailsByCustomerIdCallback(req, res);
            return;
        }
        case 'GetCustomersList': {
            await handleGetCustomersListCallback(req, res);
            return;
        }

        default: {
            console.log('Unknown location: ', location);
            res.sendStatus(422);
        }
    }
};

const handleGetCustomerDetailsByCustomerIdCallback = async (req, res) => {
    const body = req.body;
    console.log('Getting Customer details: ', body.CustomerId);

    const workerIdentity = body.Worker;
    const customerId = body.CustomerId;

    // Fetch Customer Details based on his ID
    // and information about a worker, that requested that information
    const customerDetails = await getCustomerById(customerId);

    // Respond with Contact object
    res.send({
        objects: {
            customer: {
                customer_id: customerDetails.customer_id,
                display_name: customerDetails.display_name,
                channels: customerDetails.channels,
                links: customerDetails.links,
                avatar: customerDetails.avatar,
                details: customerDetails.details
            }
        }
    });
};

const handleGetCustomersListCallback = async (req, res) => {
    console.log('Getting Customers list');

    const body = req.body;
    const workerIdentity = req.body.Worker;
    const pageSize = parseInt(body.PageSize);
    const anchor = body.Anchor;

    // Fetch Customers list based on information about a worker, that requested it
    const customersList = await getCustomersList(workerIdentity, pageSize, anchor);

    // Respond with Customers object
    res.send({
        objects: {
            customers: customersList
        }
    });
};

module.exports = crmCallbackHandler;
