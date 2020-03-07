//Origen de datos
const url = 'https://gist.githubusercontent.com/miguepiscy/2d431ec3bc101ef62ff8ddd0e476177f/raw/2482274db871e60195b7196c602700226bdd3a44/practica.json'
const api = 'https://raw.githubusercontent.com/baiofer/PracticaD3/master/airbnb_mod.csv'

//Constantes de la aplicación
const width = 1000
const height = 600
const madrid = []

//Recogida de los datos
d3.json(url)
    //Datos de la practica
    .then( madrid => {
        d3.csv(api)
            //Datos de airbnb
            .then( airbnb => {
                parseAirbnb(airbnb)
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

    //Creo el título de la página
    const groupTitle = svg
        .append('g')
    groupTitle   
        .attr('class', 'title')
        .attr('transform', 'translate(200, 30)')

    const title = groupTitle
        .append('text')
    title
        .text('PRECIOS MEDIOS POR BARRIOS DE MADRID')

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
            //Detecto la selección del barrio (1 -> no seleccionado)
            if (d.selected === 1) d.selected = 0.3
            else d.selected = 1
            //Pongo la opacidad en función de la selección
            d3.select(this).attr('opacity', d.selected)
            //Si no esta seleccionado, borro la gráfica
            if (d.selected === 1) deleteGraph()
            //Si está seleccionado, pinto la gráfica
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
    const data = dataIn.avgbedrooms
    //const data1 = extractData(dataIn)
    console.log(dataIn)

    //Borro lo que haya previamente
    deleteGraph()

    //Constantes de la función
    const marginY = 150
    const marginX = 40
    const marginLeft = 80
    const widthBar = 30
    const separationBars = 20
    const separationText = 5
    const separationTextY = 10
    const separationTextX = 85

    //Creo un array con los totales
    const total = []
    data.forEach( d => total.push(d.total))

    //Calculo el total máximo y mínimo
    const maxTotal = d3.max(total)
    const minTotal = d3.min(total)

    //Creo las escalas para los ejes de la gráfica
    const scaleX = d3.scaleLinear()
        .domain([minTotal, maxTotal])
        .range([marginX, (width / 2) - marginLeft])
    
    //Creo un grupo para la gráfica
    const groupGraph = svg
        .append('g')
        .attr('class', 'graph')
        .attr('transform', `translate(${ width / 2}, 0)`)
    
    //Creo un grupo para las barras y textos
    const groupBars = groupGraph
        .selectAll('g')
        .data(data)
        .enter()
        .append('g')
    groupBars
        .attr('class', 'groupBars')
        .attr('transform', (d,i) => {
            const coordY = height -  marginY - i * (widthBar + separationBars)
            return `translate(${marginX}, ${ coordY})`
        })

    //Creo las barras y las añado al grupo groupBars
    const bars = groupBars
        .append('rect')
    bars
        .attr('class', 'bars')
        .attr('width', d => scaleX(d.total) - marginLeft / 2)
        .attr('height', widthBar)
        .attr('opacity', 0.1)
    
    //Creo los textos con los totales y se los añado al grupo groupBars
    const textTotal = groupBars
        .append('text')
    textTotal
        .attr('class', 'totalClass')
        .text( d => d.total)
        .attr('x', d => scaleX(d.total) + separationText - marginLeft / 2)
        .attr('y', separationBars)
        .attr('opacity', 0.5)

    //Creo los textos con el número de dormitorios y se lo añado grupo groupBars
    const textBedrooms = groupBars
        .append('text')
    textBedrooms
        .attr('class', 'bedroomClass')
        .text( d => d.bedrooms)
        .attr('x', - separationTextY)
        .attr('y', separationBars)

    //Creo los ejes y los añado al grupo groupGraph
    //El eje Y no tiene escala. Lo añado a mano

    const axisY = groupGraph
        .append('line')
    axisY
        .attr('class', 'axisY')
        .attr('x1', 0 + marginX)
        .attr('y1', height - marginY + widthBar)
        .attr('x2', 0+ marginX)
        .attr('y2', height -  marginY -  5 * (widthBar + separationBars))
        .attr('stroke', 'black')
        .attr('stroke-width', 1)
    
    const totalTicks = () => {
        if (maxTotal > 20) ticks = 10
        else ticks = maxTotal
        return ticks
    }

    const axisX = d3.axisBottom(scaleX).ticks(totalTicks())

    groupGraph
        .append('g')
        .attr('class', 'axisX')
        .attr('transform', `translate(0, ${ height - marginY + widthBar })`)
        .call(axisX)
    
    //Creo los textos de los ejes y los añado al grupo groupGraph
    const textAxisX = groupGraph
        .append('text')
    textAxisX
        .attr('class', 'bedroomClass')
        .attr('transform', `translate(${ width / 4 }, ${ height - separationTextX })`)
        .text('Total alojamientos')
    
    const textAxisY = groupGraph
        .append('text')
    textAxisY
        .attr('class', 'bedroomClass')
        .attr('transform', `translate(${separationBars}, ${ height -  marginY - 5 * (widthBar + separationBars) - separationTextY })`)
        .text('Habitaciones')
    
    //Crear textos con nombre del barrio y precio medio
    const textNeighbourhood = groupGraph
        .append('text')
    textNeighbourhood
        .attr('class', 'neighbourhoodClass')
        .attr('transform', 'translate(250, 200)')
        .text(dataIn.name)

    const price = dataIn.avgprice ? dataIn.avgprice : 0

    const textAvgPrice = groupGraph
        .append('text')
    textAvgPrice
        .attr('class', 'avgpriceClass')
        .attr('transform', 'translate(250, 220)')
        .text(`Precio medio: ${ price } euros`)
}

//Seleccionar alojamientos de Madrid
function parseAirbnb(data) {
    for (let key in data) {
        if (data[key].City === 'Madrid') madrid.push(data[key])
    }
}

//De aquí para abajo no lo uso ya que hay un montón de barrios que no coinciden sus nombres entre los dos ficheros.

//Seleccionar alojamientos del barrio seleccionado
function extractData(data) {
    const madridNeighbourhood = []
    const neighbourhood = data.name
    const barrios = []
    console.log(neighbourhood)
    for (let key in madrid) {
        if (madrid[key].Neighbourhood === neighbourhood) {
            madridNeighbourhood.push(madrid[key])
        }
    }
    //console.log(madridNeighbourhood)
    //Barrios
    for (let key in madrid) {
        barrios.push(madrid[key].Neighbourhood)
    }
    //console.log(barrios)
    //console.log(barrios.unique())
}

//Eliminar valores repetidos de un array
Array.prototype.unique=function(a){
    return function(){return this.filter(a)}}(function(a,b,c){return c.indexOf(a,b+1)<0
});

