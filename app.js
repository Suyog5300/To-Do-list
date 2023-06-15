//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", { useNewUrlParser: true });

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);


const item1 = new Item({
  name: "Welcome to your Todo list!",
});

const item2 = new Item({
  name: "Hit the '+' button to add a new item"
});

const item3 = new Item({
  name: "<--- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

// ...

app.get("/", function (req, res) {

  // const day = date.getDate();
  Item.find({}) // No callback function
    .then(foundItems => {
      // console.log(foundItems);
      if (foundItems.length === 0) {
        // ---
        Item.insertMany(defaultItems)
          .then(() => {
            console.log("Success!");
          })
          .catch((err) => {
            if (err && err.writeErrors && err.writeErrors.length) {
              console.log(err.writeErrors);
            } else {
              console.log(err);
            }
          });
        res.render("/");
      }
      else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
      // ---
    })
    .catch(err => {
      console.log(err);
    });
  // res.render("list", {listTitle: "Today", newListItems: defaultItems});
});

app.get("/:customListName", function(req, res){
  const customListName =  _.capitalize(req.params.customListName);

  List.findOne({name: customListName})
    .exec() // Execute the query
    .then(foundList => {
      if (!foundList) {
        // console.log("Doesn't exist!");
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems // Updated property name to "items"
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        // console.log("Exists!");
        //Show an existing list
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items })
      }
    })
    .catch(err => {
      console.log(err);
    });


});



app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save()
      .then(() => {
        res.redirect("/");
      })
      .catch(err => {
        console.log(err);
        res.redirect("/");
      });
  } else {
    List.findOne({ name: listName })
      .exec()
      .then(foundList => {
        if (foundList) {
          foundList.items.push(item);
          return foundList.save();
        } else {
          // Create a new list if it doesn't exist
          const newList = new List({
            name: listName,
            items: [item]
          });
          return newList.save();
        }
      })
      .then(() => {
        res.redirect("/" + listName);
      })
      .catch(err => {
        console.log(err);
        res.redirect("/");
      });
  }
});


app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
    .then(() => {
      console.log("Item removed successfully!");
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
      res.redirect("/");
    });
  } else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}})
  .then(foundList => {
    if (foundList) {
      res.redirect("/" + listName);
    } else {
      res.redirect("/");
    }
  })
  .catch(err => {
    console.log(err);
    res.redirect("/");
  });

  }
});


app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
