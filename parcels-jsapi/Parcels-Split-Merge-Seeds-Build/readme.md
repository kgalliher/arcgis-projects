# Parcel Fabric - Split/Merge/Build demo

`Parcels-Split-Merge-Seeds-Build` is a TypeScript application that provides a user interface to select parcels in a parcel fabric, run the Merge function from the parcelfabricserver REST endpoint, and update specific attributes of the new parcel.

## Installation

Before installing the project, make sure you have installed Node.js and npm on your machine.

To install the project, follow these steps:

1. Clone the repository to your local machine using Git:

```
git clone https://github.com/kgalliher/arcgis-projects.git
```

2. Navigate to the `parcels-jsapi/Parcels-Split-Merge-Seeds-Build` directory:

```
cd parcels-jsapi/Parcels-Split-Merge-Seeds-Build
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


### Merge Workflow:
1. Click `Begin` in the top-right dialog
2. Enter a string for a new Parcel Record name
3. Click `Create Record`
4. Select two or more parcels
5. Click Merge

### Split Workflow:
1. Click `Begin` in the top-right dialog
2. Enter a string for a new Parcel Record name
3. Click `Create Record`
4. Select one or more parcels
5. Click `Copy Lines To Parcel Type`
6. From the Editor pane on the left, select `Published Lines`
7. Draw a line(s) to "split" the empty parcel into multiple parts
8. Click `Create` to finish drawing the line
9. Click `Create Seeds` from the menu on the right
10. Click `Build Active Record` from the same menu