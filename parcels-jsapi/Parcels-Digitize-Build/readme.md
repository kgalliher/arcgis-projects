# Parcel Fabric - Digitize/Build Parcels

`Parcels-Digitize-Build` is a TypeScript application that allows a user to build closed loops of lines or polygons into parcels. This sample makes use of the standard Editor widget to draw lines or polygons; the `ParcelFabricServer/createSeeds` function to detect closed loops and insert parcel polygons and the `ParcelFabricServer/Build` function to finish the parcel creation process

## Installation

Before installing the project, make sure you have installed Node.js and npm on your machine.

To install the project, follow these steps:

1. Clone the repository to your local machine using Git:

```
git clone https://github.com/kgalliher/arcgis-projects.git
```

2. Navigate to the `parcels-jsapi/Parcels-DigitizeBuild` directory:

```
cd parcels-jsapi/Parcels-DigitizeBuild
```

3. Install the dependencies:

```
npm install
```

## Usage

To start the application, run the following command:

This project uses Vite.

```
npm run dev
```

This will start a development server and open the application in your default web browser (defaults to `http://localhost:5173/`). 

Login:  `admin`/`esri.agp`

### Digitize Line Workflow
1. Click `Begin` on top-right menu
2. Type a name for a new parcel record
3. Click the `Create Record` button 
4. Select the `Published Lines` template on Editor pane
5. Draw a closed loop of lines in the map
6. Click `Create` in the Editor pane
7. Click the `Create Seeds` button in the right menu
8. Click the `Build` button to "build" the parcel

### Digitize Polygon Workflow
1. Click `Begin` on top-right menu
2. Type a name for a new parcel record
3. Click the `Create Record` button 
4. Select the `Published Parcels` template on Editor pane
5. Draw a polygon in the map
6. Click `Create` in the Editor pane
7. Click the `Build` button to "build" the parcel