// Establish a preselection so to guide the user.
popularRlibs =  ["devtools","dplyr","readxl","R6","tidyr",
"boot","Rcpp","tibble","mgcv","xlsx","tidyverse","lubridate",
"stingr","colorspace","backports"]
popoularTasks = ["Image processing", 'Information visualization', 'Application development','Natural Language Processing','Evolutionary Computing',
'Machine Learning','Artificial intelligence','Computational neuroscience','Computational science','Computational chemistry','Numerical analysis','Parallel computing',
'Data mining','DAP Programming']

var shuffledLibs = popularRlibs.sort(function(){return .5 - Math.random()});
var shuffledTasks = popoularTasks.sort(function(){return .5 - Math.random()});
var preSelectionLibs = shuffledLibs.slice(0,2); // For some reason I don't manage to have pre selection > 1
var preSelectionTasks = shuffledTasks.slice(0,3); // For some reason I don't manage to have pre selection > 1


$(document).ready(function(){

  // Populate the library (first) selection input
  optgroup0 = document.createElement("optgroup")
  optgroup0.id = "optgrp0"
  optgroup0.label = "R"
  document.getElementById('input0').appendChild(optgroup0); // append optgrp
  packList.forEach(function(item, i){
    lib = document.createElement("option")
    lib.value = item
    lib.innerHTML = item
    document.getElementById('optgrp0').appendChild(lib); // append individual tags
  })
  //
  // // Populate the task selection (second) input
  // input1 = document.getElementById('input1')
  // topology.forEach(function(item, i){
  //   newcluster = document.createElement("optgroup")
  //   newcluster.id = item.name
  //   newcluster.label = item.name
  //   input1.appendChild(newcluster)
  //   item.constituents.forEach(function(component, j){
  //     newtask = document.createElement("option")
  //     newtask.value = component.name
  //     newtask.innerHTML = component.name
  //     document.getElementById(item.name).appendChild(newtask);
  //   })
  // })

  // Transform html select inputs to select2 inputs. Give them initial values.
/////  $(document).ready(function() {
    // Pre-select (restrict to well known library pairs)
    // $('#input0').select2().val(preSelectionLibs).trigger("change");

     $("#input0").select2({
      width: "100%",
       templateSelection: function (data, container) {
         var selection = $('#input0').select2('data');
         var idx = selection.indexOf(data);
         data.idx = idx;
         $(container).css("background-color", COLORPAL[data.idx]);
         return data.text;
       },
     }).val(preSelectionLibs).trigger("change");

    // Pre-select (restrict to well known library pairs)
    // $('#input1').select2().val(preSelectionTasks).trigger("change");
/////  });
  $.fn.select2.defaults.set( "theme", "bootstrap" );

  // Update page content based on selection
  $("#input0").change(function(){
      var selections = $(".firstSelectContainer").find(".select2-selection__choice");

      if (selections.length) {
        console.log("selections.length")
        for (var i = 0; i < selections.length; i++) {
          var selection = selections[i];
          var selectionJQ = $(selection);
          selectionJQ.attr("style", "background: " + COLORPAL[i] + " !important");
        }
      }

      currentSelection = $("#input0").val()
      if (currentSelection.length > 0) { // do nothing if change is deletion of unique selected tag
         $.ajax({
           url : '/sendMeDatJS',
           type : 'GET',
           dataType : 'json',
           data: "currentSelection="+ currentSelection, // annoying detail: if you put spaces around the equal sign it sends nuts!
           success : function(response, status) { pageGenerator(response, "#input0")},
           error : function(resultat, statut, erreur){
             console.log('/sendMeDatJS ajax call failed')
           },
           complete : function(resultat, statut){
             console.log('/sendMeDatJS ajax call completed')
           }
        });
      }

     $("#input0").on("select2:select", function (evt) {
       var element = evt.params.data.element;
       var $element = $(element);

       $element.detach();
       $(this).append($element);
       $(this).trigger("change");
     });
  })

  // // Create DataTable
  // DTbuilder("datatable0")
  //
  // // Update table of recommandations on selection
  // $("#input0").change(function(){
  //     currentSelection = $("#input0").val()
  //     if (currentSelection.length > 0) {
  //       datatable0.clear().draw()  // void the table
  //       var suggestions=shuffledLibs.slice(3,6); // make some random suggestions
  //       var dataSet = [
  //         [ suggestions[0], "10", "0", ""],
  //         [ suggestions[1], "7", "1", ""],
  //         [ suggestions[2], "7", "0", ""]
  //       ];
  //       dataSet.forEach(function(row ,i){
  //         datatable0.row.add(row).draw( false )
  //       })
  //     }
  // })

  // trigger a change so the page gets populated upon launching (ow. no change)
  $("#input0").change()
})

function pageGenerator(response, inputID){

  // retrieve the libraries currently under study
  currentSelection = $(inputID).val()

  // each elements of the supSets correspond to one library
  supSetTS = []   // for the time series
  supSetRadar = []   // for the radar

  referenceRadar = [4000,1300,1,4000000,1] // HOW TO CALIBRATE IT?

  // for each of the libraries under consideration
  currentSelection.forEach(function(tag, i){
    // isolate the data received from the server
    var data = response[tag]
    // build the data used for the time series
    var dates = unpack(data.cran.downloads, 'day')
    var dailyDwld = unpack(data.cran.downloads, 'downloads')
    supSetTS.push([dates, dailyDwld])
    // build the data used for the radar
    var githubDat = data.github.length > 0 ? data.github[1] : 0; // case where no match on gihub
    var totalCranDwld = arraySum(dailyDwld)
    subSet = [data.soflw, githubDat, data.googleTrend, totalCranDwld, data.doc]
    // rounding and normalizing radar data wrt referenceRadar
    var subSet = subSet.map(function(n, j) { return Math.round(1000*n / referenceRadar[j])/1000; });
    supSetRadar.push(subSet)
  })

  // draw
  drawPlotlyTS(supSetTS, id = "timeseries0", names = currentSelection)
  radarConstructor("radarchart0", arrayOfDataArrays = supSetRadar)
}

// des missing
function unpack(rows, key) {
  return rows.map(function(row) { return row[key]; });
}

// cumulative sum of the entries of an array
function arraySum(anArray){
  var count=0;
  for (var i=anArray.length; i--;) { // apparently faster so
    count+=anArray[i];
  }
  return(count)
}

// wrapper around datatable
function DTbuilder(id){
  $('#' + id).DataTable( {
      "paging": false,
      "searching": false,
      "info": false,
      columns: [
          { title: "Name" },
          { title: "Prevalence" },
          { title: "Tendency" },
          { title: "Add to Comp." }
      ],
      columnDefs: [ {
         orderable: false,
         className: 'select-checkbox',
         checkboxes: {
            'selectRow': true
         },
         targets: 3
       } ],
       select: {
           // selector: 'td:first-child',
           style:    'multi'
       },
       order: [[ 1, 'asc' ]]
  } );
}
