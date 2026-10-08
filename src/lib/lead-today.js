const today = new Date().toISOString().split("T")[0];

const todayLeads = leads.filter((lead) => lead.date === today);
