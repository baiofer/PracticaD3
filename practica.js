//Origen de datos
const url = 'https://gist.githubusercontent.com/miguepiscy/2d431ec3bc101ef62ff8ddd0e476177f/raw/2482274db871e60195b7196c602700226bdd3a44/practica.json'
const api = 'https://storage.cloud.google.com/practica-data-visualization/airbnb_mod.csv?folder&hl=es&organizationId'

//Constantes de la aplicación
const width = 1000
const height = 600

//Recogida de los datos
d3.json(url)
    .then( madrid => {
        d3.csv(api)
            .then( airbnb => {
                console.log(airbnb)
            })
        drawMap(madrid)
    })
    .catch( error => {
        console.log('Error: ', error)
    })

//Pintar mapa
function drawMap(map) {
    //Constantes de la función
    const border = 100

    //Pintar el "svg"
    const svg = d3.select('#mapa')
        .append('svg')
    svg
        .attr('width', width)
        .attr('height', height)

    //Creo la proyección (escala)
    //El centro exacto del mapa a pintar lo saco con esta función
    const center = d3.geoCentroid(map)

    const projection = d3.geoMercator()
        .fitSize([(width / 2) - border, (height) - border], map)
        .center(center)
        .translate([width / 4, height / 2])

    //Creamos el path de nuestro mapa con la escala calculada
    const pathMap = d3.geoPath().projection(projection)

    //Pintamos las coordenadas que están en features
    const features = map.features

    //Metemos todo el mapa en un grupo
    const groupMap = svg
        .append('g')
    groupMap
        .attr('class', 'map')
     
    //Ahora al grupo, le añado el path de cada barrio (subunit). Lo pinto
    const subunits = groupMap    
        .selectAll('.subunits')
        .data(features)
        .enter()
        .append('path')
    subunits
        .attr('d', d => {
            d.selected = 1
            return pathMap(d)
        })
    
    //Al hacer click en un barrio, reduzco la opacity para que se note que está seleccionado
    subunits
        .on('click', function clickSubunits(d) {
            if (d.selected === 1) d.selected = 0.3
            else d.selected = 1
            d3.select(this).attr('opacity', d.selected)
            if (d.selected === 1) deleteGraph()
            //else drawGraph(d)
            else drawGraph(d.properties, svg)
        })
    
    //Creo un array con los precios medios
    const avgPrice = []
    features.forEach( d => {
        if (d.properties.avgprice) avgPrice.push(d.properties.avgprice)
    });
    //Calculo el precio máximo
    const maxPrice = d3.max(avgPrice)

    //Le doy colores a cada uno de los barrios
    subunits   
        .attr('fill', d => fillColor(d.properties.avgprice, maxPrice))
}

function fillColor(avgPrice, maxPrice) {
    const price = avgPrice || 0
    return d3.interpolateRainbow(price / maxPrice)
}

function deleteGraph(){
        
    d3.select('.graph').remove()
}

function drawGraph(dataIn, svg){
    //Preparo los datos
    const data = parser(dataIn)

    //Constantes de la función
    const marginY = 20
    const marginX = 40
    const anchoBarra = 20
    const separacion = 2


    
    
    //Creo un array con los totales
    const total = []
    data.forEach( d => total.push(d.total))

    //Calculo el total máximo y mínimo
    const maxTotal = d3.max(total)
    const minTotal = d3.min(total)
    console.log(maxTotal, minTotal)

    //Creo un array con las bedrooms
    const bedrooms = []
    data.forEach( d => bedrooms.push(d.bedrooms))

    //Calculo el bedrooms máximo y mínimo
    const maxBedrooms = d3.max(bedrooms)
    const minBedrooms = d3.min(bedrooms)
    console.log(maxBedrooms, minBedrooms)


    //Creo las escalas para los ejes de la gráfica
    const scaleY = d3.scaleLinear()
        .domain([maxTotal, minTotal])
        .range([(height - marginY), 0])

    const scaleX = d3.scaleLinear()
        .domain([maxBedrooms, minBedrooms])
        .range([marginX, (width / 2)])
    
    //Creo un grupo para la gráfica
    const groupGraph = svg
        .append('g')
        .attr('class', 'graph')
        .attr('transform', `translate(${ width / 2}, 0)`)
    
    //Creo las barras y las añado al grupo
    const bars = groupGraph
        .selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
    bars
        .attr('class', 'bars')
        .attr('x', (d, i) => i * anchoBarra + separacion)
        .attr('y', d => {
            console.log('EjeX: ', d.total, d.total * scaleY)
        })
        .attr('width', anchoBarra)
        .attr('height', d => {
            console.log ('Eje Y: ', d.bedrooms, d.bedrooms * scaleX)
        })

    //Creo los ejes y los añado al grupo
    const axisY = d3.axisLeft(scaleY)

    groupGraph
        .append('g')
        .attr('class', 'axisX')
        .attr('transform', `translate(${ marginX }, ${ marginY})`)
        .call(axisY)

    const axisX = d3.axisBottom(scaleX)

    groupGraph
        .append('g')
        .attr('class', 'axisY')
        .attr('transform', `translate(0, ${ height - marginY })`)
        .call(axisX)

}

function parser(data) {
    const avgBedrooms = data.avgbedrooms
    console.log(avgBedrooms)
    const arr = []
    for (let key in avgBedrooms) {
        arr.push(avgBedrooms[key])
    }
    console.log(arr)
    return arr
}