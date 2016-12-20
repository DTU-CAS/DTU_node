var l_styles = {
  "Adgangsvej - ansatte": {
    color: "#26bded",
    fillColor: "#000",
    opacity: 1,
    fillOpacity: 0,
    weight: 3.5,
    dashArray: "5, 5"
  },
  "Adgangsvej - håndværker": {
    color: "#6c26ed",
    fillColor: "#000",
    opacity: 1,
    fillOpacity: 0,
    weight: 3.5,
    dashArray: "5, 5"
  },
  "Midlertidig gangsti": {
    color: "#FF33FF",
    fillColor: "#000",
    opacity: 1,
    fillOpacity: 0,
    weight: 3.5,
    dashArray: "5, 5"
  },
  "Tung trafik": {
    color: "#a37c25",
    fillColor: "#000",
    opacity: 1,
    fillOpacity: 0,
    weight: 3.5,
    dashArray: "5, 5"
  },
  "Lukket for gennemkørsel": {
    color: "#eba917",
    fillColor: "#000",
    opacity: 1,
    fillOpacity: 0,
    weight: 4.5
  },
  "Parkering": {
    color: "#000",
    fillColor: "#FF00FF",
    opacity: 1,
    fillOpacity: 0.3,
    weight: 2
  },
  "Materialelager": {
    color: "#000",
    fillColor: "#dd3e22",
    opacity: 1,
    fillOpacity: 0.3,
    weight: 1.5,
    dashArray: "5, 5"
  },
  "Byggeplads": {
    color: "#00CCFF",
    fillColor: "#000",
    opacity: 1,
    fillOpacity: 0,
    weight: 2.5
  },
  "Nybyggeri": {
    color: "#2e2d2b",
    fillColor: "#ffbf00",
    opacity: 1,
    fillOpacity: 0.25,
    weight: 2.5,
    dashArray: "5, 5"
  },
  "Ombygning/renovering": {
    color: "#ed0e58",
    fillColor: "#ed0e58",
    opacity: 1,
    fillOpacity: 0.25,
    weight: 2.5,
    dashArray: "5, 5"
  },
  "Midlertidig bygning": {
    color: "#1c08ba",
    fillColor: "#1c08ba",
    opacity: 1,
    fillOpacity: 0.25,
    weight: 2.5,
    dashArray: "5, 5"
  },
  "Anlæg": {
    color: "#55f73a",
    fillColor: "#55f73a",
    opacity: 1,
    fillOpacity: 0.25,
    weight: 2.5,
    dashArray: "5, 5"
  },
  "Bygninger": {
    color: "#000",
    fillColor: "#333",
    opacity: 1,
    fillOpacity: 0.25,
    weight: 2
  },
  "Standard": {
    color: "#0d88d7",
    fillColor: "#0d88d7",
    opacity: 1,
    fillOpacity: 0.15,
    weight: 1.75
  },
  "undefined": {
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
  } else if ( string === "all" || string === "Bygninger") {
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

function abbr ( string ) {
  var arr =
  [
    "BYR",
    "BYM",
    "ANL",
    "BYO",
    "BPH",
    "AVT",
    "GSA",
    "AVK",
    "AVH",
    "AVB",
    "PKA",
    "PKH"
  ];

  if(arr.indexOf(string) !== -1){
    return true;
  } else {
    return false;
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
    "AVH": "Adgangsvej - håndværker",
    "AVB": "Adgangsvej - ansatte",
    "PKA": "Materialelager",
    "PKH": "Parkering",
    "Ombygning/renovering": "BYR",
    "Midlertidig bygning": "BYM",
    "Anlæg": "ANL",
    "Byggeplads": "BPH",
    "Tung trafik": "AVT",
    "Midlertidig gangsti": "GSA",
    "Lukket for gennemkørsel": "AVK",
    "Adgangsvej - håndværkerer": "AVH",
    "Adgangsvej - ansatte": "AVB",
    "Materialelager": "PKA",
    "Parkering": "PKH",
    "Nybyggeri": "BYO"
  };
  return typeLookUp[ string ];
}
