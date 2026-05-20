const matchDonorsToRequest = async (request, donors) => {
  // simple matching logic based on blood group and distance
  return donors.filter(d => d.bloodGroup === request.bloodGroup);
};

module.exports = {
  matchDonorsToRequest
};
