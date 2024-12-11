const xml2js = require("xml2js");
const extractCity = async (xml) => {
  try {
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xml);
    //console.log("result: from location iq " + JSON.stringify(result));
    // Access the city value
    const city = result.reversegeocode.addressparts[0].city[0];
    console.log(city);
    return city;
  } catch (error) {
    console.error("Error parsing XML:", error.message);
  }
};

module.exports = { extractCity };
