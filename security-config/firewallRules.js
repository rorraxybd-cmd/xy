/**
 * rorraxy security configuration - Firewall Rules
 * Filters and blocks suspicious automated tools, vulnerability scanners, and malicious traffic.
 */

const firewallRules = {
    // ক্ষতিকর বা পরিচিত হ্যাকিং টুলসের ইউজার-এজেন্ট ব্ল্যাকলিস্ট
    blockedUserAgents: [
        'sqlmap',
        'nikto',
        'nessus',
        'masscan',
        'nmap',
        'zgrab',
        'dirbuster',
        'gobuster'
    ],

    /**
     * ফায়ারওয়াল ইন্সপেকশন মিডলওয়্যার
     */
    inspectRequest: (req, res, next) => {
        const userAgent = (req.headers['user-agent'] || '').toLowerCase();
        
        // ১. ক্ষতিকর স্ক্যানার বা বটের ইউজার এজেন্ট চেক করা
        const isBlockedAgent = firewallRules.blockedUserAgents.some(agent => userAgent.includes(agent));
        if (isBlockedAgent) {
            console.warn(`[Firewall Alert]: Blocked malicious User-Agent: ${userAgent} from IP: ${req.ip}`);
            return res.status(403).json({
                success: false,
                message: 'Access Denied: Request blocked by rorraxy security firewall.'
            });
        }

        // ২. অতিরিক্ত সিকিউরিটি চেক (প্রয়োজন সাপেক্ষে এখানে আইপি হোয়াইটলিস্ট বা ব্ল্যাকলিস্ট যুক্ত করা যাবে)

        if (typeof next === 'function') {
            next();
        }
    }
};

module.exports = firewallRules;
