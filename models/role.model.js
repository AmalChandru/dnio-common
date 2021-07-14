const log4js = require('log4js');

const logger = log4js.getLogger(global.loggerName);

/**
* @returns {Promise<string[]>} Returns Array of userIds
*/
async function getApproversList() {
    try {
        const records = await global.authorDB.collection('userMgmt.roles').aggregate([
            { $match: { _id: filter.serviceId } },
            { $unwind: '$roles' },
            { $unwind: '$roles.operations' },
            { $match: { 'roles.operations.method': 'SKIP_REVIEW' } },
            {
                $lookup: {
                    from: 'userMgmt.groups',
                    localField: 'roles.id',
                    foreignField: 'roles.id',
                    as: 'groups'
                }
            },
            { $unwind: '$groups' },
            { $unwind: '$groups.users' }
        ]);
        if (records && records.length > 0) {
            return records.map(e => e.groups.users);
        }
        return [];
    } catch (err) {
        logger.error('workflow.utils>getApproversList', err);
        return [];
    }
}

/**
 * @returns {boolean} Returns true/false
 */
async function isWorkflowEnabled(req, filter) {
    try {
        const records = await global.authorDB.collection('userMgmt.roles').aggregate([
            { $match: { _id: filter.serviceId } },
            { $unwind: '$roles' },
            { $unwind: '$roles.operations' },
            { $match: { 'roles.operations.method': 'REVIEW' } }
        ]);
        if (records && records.length > 1) {
            return true;
        }
        return false;
    } catch (err) {
        logger.error(err);
        throw err;
    }
}

/**
 * @returns {Promise<boolean>} Returns a boolean Promise
 */
async function hasSkipReview(req, filter) {
    try {
        const userId = req.headers[global.userHeader];
        if (!userId) {
            logger.debug('UserID not found in request');
            throw new Error('UserID not found in request');
        }

        const records = await global.authorDB.collection('userMgmt.roles').aggregate([
            { $match: { _id: filter.serviceId } },
            { $unwind: '$roles' },
            { $unwind: '$roles.operations' },
            { $match: { 'roles.operations.method': 'SKIP_REVIEW' } },
            {
                $lookup: {
                    from: 'userMgmt.groups',
                    localField: 'roles.id',
                    foreignField: 'roles.id',
                    as: 'groups'
                }
            },
            { $match: { 'groups.users': userId } },
        ]);
        if (records && records.length > 1) {
            return true;
        }
        return false;
    } catch (err) {
        logger.error(err);
        throw err;
    }
}

/**
 * @returns {Promise<boolean>} Returns a boolean Promise
 */
async function hasManagePermission(req, filter) {
    try {
        const userId = req.headers[global.userHeader];
        if (!userId) {
            logger.debug('UserID not found in request');
            throw new Error('UserID not found in request');
        }

        const records = await global.authorDB.collection('userMgmt.roles').aggregate([
            { $match: { _id: filter.serviceId } },
            { $unwind: '$roles' },
            { $unwind: '$roles.operations' },
            { $match: { 'roles.operations.method': { $in: ['POST', 'PUT', 'DELETE'] } } },
            {
                $lookup: {
                    from: 'userMgmt.groups',
                    localField: 'roles.id',
                    foreignField: 'roles.id',
                    as: 'groups'
                }
            },
            { $match: { 'groups.users': userId } },
        ]);
        if (records && records.length > 1) {
            return true;
        }
        return false;
    } catch (err) {
        logger.error(err);
        throw err;
    }
}



/**
 * @returns {Promise<boolean>} Returns a boolean Promise
 */
async function isPreventedByWorkflow(req, filter) {
    try {
        const userId = req.headers[global.userHeader];
        if (!userId) {
            logger.debug('UserID not found in request');
            throw new Error('UserID not found in request');
        }

        let records = await global.authorDB.collection('userMgmt.roles').aggregate([
            { $match: { _id: filter.serviceId } },
            { $unwind: '$roles' },
            { $unwind: '$roles.operations' },
            { $match: { 'roles.operations.method': 'REVIEW' } }
        ]);
        if (!records || records.length == 0) {
            return false;
        }
        records = await global.authorDB.collection('userMgmt.roles').aggregate([
            { $match: { _id: filter.serviceId } },
            { $unwind: '$roles' },
            { $unwind: '$roles.operations' },
            { $match: { 'roles.operations.method': 'SKIP_REVIEW' } },
            {
                $lookup: {
                    from: 'userMgmt.groups',
                    localField: 'roles.id',
                    foreignField: 'roles.id',
                    as: 'groups'
                }
            },
            { $match: { 'groups.users': userId } },
        ]);
        if (records && records.length > 1) {
            return false;
        }
        return true;
    } catch (err) {
        logger.error(err);
        throw err;
    }
}

module.exports = {
    hasSkipReview,
    isWorkflowEnabled,
    getApproversList,
    hasManagePermission,
    isPreventedByWorkflow
};