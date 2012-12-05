define(['jquery', 'politicians', 'pack', 'typeahead'], 
  function($, Politicians, PackChart, typeahead) {
  "use strict"
  // read senate and chamber of deputies data

  // TODO: remove this crap when the data is cleaned up
  function toTitleCase(txt) {
    var parts = txt.split(' ');
    if (parts.length > 1) {
      var result = '';
      parts = parts.map(function (val) {
        return toTitleCase(val);
      });
      return parts.join('-');
    }
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  }

  function getLastName(name) {
    var parts = name.split(' ');
    return parts[parts.length - 1];
  }

  function checkFirstNames(name1, name2) {
    var getLetters = function (name) {
      name = name.split(" ");
      name = name.slice(0, name.length - 1).join("");
      return name.toLowerCase.split("").sort();
    }

    var letters1 = getLetters(name1), letters2 = getLetters(name2);
    while (letters1.length > 0 && letters2.length > 0) {
      break;
    }
  }

var count=0;
  return {
  	loadPoliticians : function () {
      var prefix = 'data/'
        , sources = ['senate', 'deputies']
        , politicians = {};
      sources.forEach(function (source) {
        $.ajax({
            url : prefix + source + '.json', 
            success : function (data) {
                politicians[source] = data;
            }, 
            async : false,
            dataType : "json"
        });
      });

      // mark the ones who are running for office again
      $.ajax({
        url : prefix + 'candidates.json',
        success : function (data) {
            $.each(data, function (idx, currentCandidate) {
                sources.forEach(function (source) {
                    var matches = politicians[source].filter(function (politician) {
                        // flag the ones whose last name is the same but first names differ
                        // if (getLastName(politician.name) === getLastName(currentCandidate.name) && politician.name !== currentCandidate.name) {
                        //   console.log(politician);
                        //   console.log(currentCandidate);
                        //   console.log('==== ' + count++);
                        // }
                        return politician.name === currentCandidate.name;
                    });
                    if (matches.length > 0) {
                      matches[0].runningAgain = true;
                      matches[0].newGroup = currentCandidate.party;
                      matches[0].newCircumscription = currentCandidate.room 
                        + currentCandidate.college + " " + toTitleCase(currentCandidate.county);
                    }

                });
            });
        },
        async : false,
        dataType : "json"
      });
      this.politicians = new Politicians(politicians);
      return this.politicians;
    },
    initTypeahead : function (flatData) {
      // create a typeahead search box to hilight
      // certain candidates
      if (!flatData) flatData = this.politicians.getList();
      var labels, mapped, that = this;
      var typeaheadOptions = {
        source : function (query, process) {
          labels = []; mapped = {};
          $.each(flatData, function (idx, politician) {
            if (politician.name.toLowerCase().indexOf(query.toLowerCase()) !== -1) {
              labels.push(politician.name);
              mapped[politician.name] = politician;
            }
          });
          process(labels);
        },
        updater : function (name) {
          var politician = mapped[name];
          that.chart.unhilight();
          that.chart.hilight(politician);
          return name;
        }
      };
      // clear the element and re-add it again
      // couldn't find a way just to update the data for the typeahead in Bootstrap
      $('#typeaheadSearch').remove();
      $('<input id="typeaheadSearch" />').appendTo('#search').typeahead(typeaheadOptions);
    },
    initToolbar : function (data) {
      // create buttons to update the chart
      // and fill with members from only one
      // party
      if (!data) data = this.politicians.getByParty()
      var $chambersBtnGroup = $('#chambersBtnGroup')
        , that = this;

      var initPartyBtnGroup = function (data, selected) {
        var $btnGroup = $('#partyBtnGroup').empty();
        $('<a href="#" class="btn">Orice partid</a>')
          .click(function (e) {
            // the update method alters the order
            // of the data, so we re-sort it again
            // so the indexes of the buttons match
            var selectedChamber = $chambersBtnGroup.find('.active').data('chamber');
            that.initTypeahead(that.politicians.getList(selectedChamber));
            that.chart.update(data);
            data.children.sort(function (a, b) { return a.children.length < b.children.length });
          }).appendTo($btnGroup);
        $.each(data.children, function (idx, party) {
          var $btn = $('<a href="#" class="btn" id="' + party.name + '">' + party.name + ' (' + party.children.length + ')</a>');
          if (party.name === selected) $btn.addClass('active');
          $btn.click(function (e) {
            var selectedChamber = $chambersBtnGroup.find('.active').data('chamber');
            that.chart.update(data.children[idx]);
            that.initTypeahead(that.politicians.getList(selectedChamber, party.name));
          });
          $btnGroup.append($btn);
        });
      };

      initPartyBtnGroup(data);
      $chambersBtnGroup.children().each(function () {
        $(this).click(function () {
          var chamber = $(this).data('chamber')
            , data = that.politicians.getByParty(chamber);
          
          // if a party is already selected, change the 
          // chart only for that one
          var party = $('#partyBtnGroup .active').attr('id');
          initPartyBtnGroup(data, party);

          if (party) {
            that.chart.update(that.politicians.getByParty(chamber, party));
          } else {
            that.chart.update(data);
            // same as above
            data.children.sort(function (a, b) { return a.children.length < b.children.length });
          }
          that.initTypeahead(that.politicians.getList(chamber, party));
        });
      })
    },
    initChart : function () {
      this.chart = new PackChart(this.politicians.getByParty());
    }
  }
});
