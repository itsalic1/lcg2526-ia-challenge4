// dichiarazione delle variabili globali
let alfaData, bravoData, charlieData;
let drones = [];
// array utile per assegnare ogni colore diverso ad ogni drone
let colors = [];
let minZ, maxZ, minX, maxX, minY, maxY;
/* specificazione di passi per drone in modo da aver un'iterazione corretta -
studio dei primi 100 passi di ogni drone */
let stepsPerDrone = 100;
let boxWidth;
let boxHeight = 260;
// per evitare che gli elementi tocchino i bordi
let margin = 40;
// per mantenere un certo spazio tra gli elementi
let spacing = 20;

// caricamento dei dataset ridotti alle prime 100 righe
function preload() {
  alfaData = loadTable("drone_alfa_reduced.csv", "csv", "header");
  bravoData = loadTable("drone_bravo_reduced.csv", "csv", "header");
  charlieData = loadTable("drone_charlie_reduced.csv", "csv", "header");
}

function setup() {
  createCanvas(windowWidth, 1000);
  // colori inseriti direttamente nell'array
  colors = [color(255, 0, 0), color(0, 150, 255), color(0, 200, 100)];

  // mi permette di estrapolare e racchiudere nell'array i dati convertiti 
  drones.push(parseDronesData(alfaData, "Alfa"));
  drones.push(parseDronesData(bravoData, "Bravo"));
  drones.push(parseDronesData(charlieData, "Charlie"));

  // array per raccogliere tutte le altitudini
  let allZ = []
  /* ogni drone risulta essere un oggetto che contiene un array
  con le coordinate z nel tempo */
  for (let drone of drones) {
    /* mi permette di prendere i dati da 0 a 100 attraverso la
    variabile stepsPerDrone */
    allZ = allZ.concat(drone.z.slice(0, stepsPerDrone));
  }

  // mi permette di identificare il valore maggiore e quello minore dell'array
  minZ = min(allZ);
  maxZ = max(allZ);

  // calcolo dello spostamento totale del drone (posizioni X e Y - differenza + teorema di Pitagora)
  for (let drone of drones) {
    let dx = drone.x[100] - drone.x[0];
    let dy = drone.y[100] - drone.y[0];
    drone.displacement = sqrt(dx * dx + dy * dy);
  }

  /* calcolo della grandezza di ogni box 
  larghezza totale disponibile + spazio tra i box + numero dei droni e spazi totali (*+1) */
  boxWidth = (width - spacing * (drones.length + 1)) / drones.length;
}

/* funzione che mi permette di creare un array per ogni posizione
z + x e y (chiamate in seguito) - con float estrapolo i dati dalla tabella */
function parseDronesData(table) {
  let drone = { x: [], y: [], z: [], };
  for (let r = 0; r < table.getRowCount(); r++) {
    let x = float(table.get(r, "x_pos"));
    let y = float(table.get(r, "y_pos"));
    let z = float(table.get(r, "z_pos"));
    // controlla che i valori siano validi e che non ci siano spazi vuoti
    if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
      // restituzione valori
      drone.x.push(x);
      drone.y.push(y);
      drone.z.push(z);
    }
  }
  return drone;
}

function draw() {
  background(240);

  // titolo + sotto titolo
  textAlign(CENTER);
  textSize(24);
  fill(0);
  text("Monitoraggio dell'altitudine dei droni", width / 2, 40);
  textSize(16);
  text("Visualizzazione dei primi 100 passi di ciascun drone", width / 2, 70);

  /* per disegnare grafico altitudine - 
  scorre tutti i droni, calcola posizione orizzontale del box */
  for (let i = 0; i < drones.length; i++) {
    let hopos = spacing + i * (boxWidth + spacing);
    // grafico dell'altitudine per un singolo drone
    drawDroneBox(drones[i], colors[i], hopos, 110, boxWidth, boxHeight);
  }

  // legenda (startX mi aiuta a definire dove inserire linee ed etichette)
  let legendY = 110 + boxHeight + 40;;
  let legendStartX = (width - 300) / 2;

  // etichette
  textAlign(LEFT);
  textSize(14);
  noStroke();

  /* legenda - associa ad ogni grafico un colore ed un'etichetta */
  // recupera dall'array dei colori i corrispondenti ad ogni grafico
  fill(colors[0]);
  rect(legendStartX, legendY - 6, 30, 3);
  fill(0);
  text("Alfa", legendStartX + 35, legendY);

  fill(colors[1]);
  rect(legendStartX + 100, legendY - 6, 30, 3);
  fill(0);
  text("Bravo", legendStartX + 135, legendY);

  fill(colors[2]);
  rect(legendStartX + 200, legendY - 6, 30, 3);
  fill(0);
  text("Charlie", legendStartX + 235, legendY);

  /* grafico a barre dello spostamento totale
  - calcolo posizione verticale + altezza grafico + margine */
  let chartY = legendY + 200;
  let chartHeight = 300;
  let chartMargin = 80;
  // funzione che disegna il grafico a barre (width - 2 * chartMargin equivale alla larghezza disponibile tra i margini)
  drawDisplacementChart(chartMargin, chartY, width - 2 * chartMargin, chartHeight);
}

// grafico altitudine droni
function drawDroneBox(drone, col, x, y, w, h) {
  push();
  translate(x, y);

  noStroke();
  fill(200, 200, 200, 100);
  rect(5, 5, w, h, 20);

  fill(255);
  rect(0, 0, w, h, 20);

  /* impostazione degli assi - 
  mi permette di definire i limiti interni del grafico tenendo conto dei margini
  (utile per non toccare box) */
  let gxStart = margin;
  let gxEnd = w - margin;
  let gyStart = margin;
  let gyEnd = h - margin;

  stroke(100);
  strokeWeight(1);
  line(gxStart, gyEnd, gxEnd, gyEnd);
  line(gxStart, gyEnd, gxStart, gyStart);

  // etichette assi
  fill(0);
  noStroke();
  textSize(14);
  textAlign(CENTER);
  text("Passi", w / 2, h - 20);
  push();
  // rotazione etichetta altezza rispetto all'asse
  translate(gxStart - 10, (gyStart + gyEnd) / 2);
  rotate(-HALF_PI);
  text("Altezza", 0, 0);
  pop();

  // impostazione del colore e dello spessore delle linee
  stroke(col);
  strokeWeight(2);
  noFill();
  // inizia la forma composta da punti collegati
  beginShape();
  /* scorre i primi 100 passi -
  posizione orizzontale mappata dal passo j / verticale mappata dall'altitudine drone.z[j] */
  for (let j = 0; j < stepsPerDrone; j++) {
    let gx = map(j, 0, stepsPerDrone, gxStart, gxEnd);
    let gy = map(drone.z[j], minZ, maxZ, gyEnd, gyStart);
    // ottengo vertex per rappresentazione
    vertex(gx, gy);
  }
  // termina la forma composta dai diversi punti
  endShape();

  pop();
}

// grafico spostamento totale 
function drawDisplacementChart(x, y, w, h) {
  push();
  translate(x + 20, y);

  // titolo + testo
  textAlign(CENTER);
  textSize(24);
  fill(0);
  text("Spostamento totale dei droni", w / 2, -70);
  textSize(16);
  text("Confronto sulla distanza percorsa da ciascun drone, relativamente ai primi 100 passi", w / 2, -45);

  noStroke();
  fill(200, 200, 200, 100);
  rect(5, 5, w, h, 20);

  fill(255);
  rect(0, 0, w + 10, h, 20);

  let gxStart = margin;
  let gxEnd = w - margin;
  let gyStart = margin;
  let gyEnd = h - margin;

  stroke(100);
  strokeWeight(1);
  line(gxStart, gyEnd, gxEnd, gyEnd);
  line(gxStart, gyEnd, gxStart, gyStart);

  fill(0);
  noStroke();
  textSize(14);
  textAlign(CENTER);

  /* disegno delle barre 
  - calcolo del massimo spostamento, utile per normalizzare le barre
  (aggiunge nuovo array per displacement + esplicitazione valore alto) */
  let maxDisp = max(drones.map(d => d.displacement));
  // calcola la larghezza delle barre
  let barWidth = (gxEnd - gxStart) / drones.length - spacing;

  for (let i = 0; i < drones.length; i++) {
    // calcolo altezza della barra (conversione del valore di displacement in altezza grafica proporzionale ) 
    let barHeight = map(drones[i].displacement, 0, maxDisp, 0, gyEnd - gyStart);
    // calcolo posizione x e y della barra
    let bx = gxStart + i * (barWidth + spacing);
    let by = gyEnd - barHeight;

    fill(colors[i]);
    rect(bx, by, barWidth, barHeight);

    fill(0);
    textSize(14);
    textAlign(CENTER);
    // etichette per mostrare il nome della barra e i valori max calcolati precedentemente
    text(drones[i].name, bx + barWidth / 2, gyEnd + 20);
    text(nf(drones[i].displacement, 1, 1), bx + barWidth / 2, by - 10);
  }

  pop();
}
