from flask import Flask
import populR

app = populR.views.app # ... does nt work if I write "import liPop.views.app as app"
if __name__ == "__main__":
    app.run(debug = app.config["DEBUG"])
