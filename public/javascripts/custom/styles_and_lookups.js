var style = {
  "Byggepladser": {
    color: "#00CCFF",
    fillColor: "#000",
    opacity: 1,
    fillOpacity: 0,
    weight: 2.5
  },
  "Parkering": {
    color: "#000",
    fillColor: "#65CAFE",
    opacity: 0,
    fillOpacity: 0.6,
    weight: 0
  },
  "Adgangsveje": {
    color: "#FF33FF",
    fillColor: "#000",
    opacity: 1,
    fillOpacity: 0.6,
    weight: 2.5,
    dashArray: "5, 5"
  },
  "Ombyg og Renovering": {
    color: "#000",
    fillColor: "#FF00CC",
    opacity: 1,
    fillOpacity: 0.15,
    weight: 2.5
  },
  "Nybyggeri": {
    color: "#000",
    fillColor: "#FF9900",
    opacity: 1,
    fillOpacity: 0.15,
    weight: 2.5
  },
  "Bygninger": {
    color: "#000",
    fillColor: "#333",
    opacity: 1,
    fillOpacity: 0.35,
    weight: 2.5
  },
  "Standard": {
    color: "#0d88d7",
    fillColor: "#0d88d7",
    opacity: 1,
    fillOpacity: 0.15,
    weight: 1.75
  }
};


function getFields( string ) {
  if ( string === "byggeri" ) {
    return [
      "Anlæg",
      "Midlertidig bygning",
      "Ombygning/renovering",
      "Nybyggeri"
    ];
  } else if ( string === "byggeplads" ) {
    return [
      "Byggeplads"
    ];
  } else if ( string === "adgangsvej" ) {
    return [
      "Tung trafik",
      "Midlertidig gangsti",
      "Lukket for gennemkørsel"
    ];
  } else if ( string === "parkering" ) {
    return [
      "Parkering",
      "Materialelager"
    ];
  } else if ( string === "status" ) {
    return [
      "Aktivt",
      "Afsluttet",
      "Garanti",
      "Ongoing"
    ];
  } else if ( string === "all" ) {
    return [
      "Anlæg",
      "Midlertidig bygning",
      "Ombygning/renovering",
      "Nybyggeri",
      "Byggeplads",
      "Tung trafik",
      "Midlertidig gangsti",
      "Lukket for gennemkørsel",
      "Parkering",
      "Materialelager"
    ];
  } else {
    return [];
  }
}

function lookUp( string ) {
  var typeLookUp = {
    "BYR": "Ombygning/renovering",
    "BYM": "Midlertidig bygning",
    "ANL": "Anlæg",
    "BYO": "Nybyggeri",
    "BPH": "Byggeplads",
    "AVT": "Tung trafik",
    "GSA": "Midlertidig gangsti",
    "AVK": "Lukket for gennemkørsel",
    "PKA": "Materialelager",
    "PKH": "Parkering",
    "Ombygning/renovering": "BYR",
    "Midlertidig bygning": "BYM",
    "Anlæg": "ANL",
    "Byggeplads": "BPH",
    "Tung trafik": "AVT",
    "Midlertidig gangsti": "GSA",
    "Lukket for gennemkørsel": "AVK",
    "Materialelager": "PKA",
    "Parkering": "PKH",
    "Nybyggeri": "BYO"
  };
  return typeLookUp[ string ];
}
