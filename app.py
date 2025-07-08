from flask import Flask ,jsonify,render_template,request,redirect, session,url_for
import requests
import os 
from google.cloud import firestore

app=Flask(__name__)
app.secret_key="key" #import form env

FIREBASE_API_KEY="AIzaSyBPNN0EsjDLT0onoR6zs-o0t9BKwX8Ycdc" # Replace this with your Firebase Web API Key (not service account)
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "credentials/firebaseconfig.json"

db = firestore.Client()

@app.route('/',methods=['GET','POST'])

def login():
    if request.method=='POST':
        email=request.form['email']
        password=request.form['password']

        payload={
            "email":email,
            "password":password,
            "returnSecureToken":True
        }

        firebaseURL= f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}"
        res=requests.post(firebaseURL,json=payload)
        data=res.json()
        

        if 'idToken' in data:
            session.permanent = False #login again when the browser is closed 
            session['user']={
                "email":data["email"],
                "uid":data["localId"],
                "token":data["idToken"]
            }
            return redirect(url_for("home")) #homepage
        
        else:
            error_msg=data.get('error',{}).get('message',"Login faild")
            return render_template("login.html",error=error_msg)
    
    return render_template("login.html")

@app.route('/home')
def home():
    if 'user' not in session:
        return redirect(url_for('login'))
    return render_template('home.html', user=session['user'])

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))



#home page handling 

@app.route('/search',methods=['POST'])
def searchParts():
    data=request.get_json()
    vehicle=data.get('vehicle','').strip()

    try:
        parts=vehicle.split()
        if len(parts)<4:
            return jsonify({"error":"Please enter Year Make Model Trim"}), 400
        year=int(parts[0])
        make=parts[1].lower()
        model=parts[2].capitalize()
        trim=" ".join(parts[3:]).upper()

        makeModelKey=f"{make}{model}"
        partsRef=db.collection("make_model_parts").document(makeModelKey).collection("parts")
        partsDocs=partsRef.stream()
        
        compatibleParts=[]
        for doc in partsDocs:
            data=doc.to_dict()
            years=data.get('compatible_years', [])
            trims=data.get('compatible_trims', [])
            if year in years and trim in  trims:
                compatibleParts.append({"id":doc.id,**data})

        if not compatibleParts:
            return jsonify([]), 200
        return jsonify(compatibleParts)

    except Exception as e:
        print("Error:",e)
        return jsonify({"error":str(e)}),500
    
@app.route('/result')
def results():
    return render_template("result.html")
                                                                                                                                                                                                                                                                                                                                          


@app.route('/laborCost')
def labor_cost():
    if 'user' not in session:
        return redirect(url_for('login'))
    return render_template("laborCost.html")

if __name__ == "__main__":
    app.run(debug=True)


#String Block 

'''
@app.route('/suggest', methods=['POST'])
def suggest_vehicles():
    query = request.get_json().get('query', '').strip().lower()
    suggestions = []

    if not query:
        return jsonify(suggestions)

    try:
        docs = db.collection("make_model_parts").stream()
        for doc in docs:
            key = doc.id.lower()
            if query in key:
                suggestions.append(doc.id)  # you can format prettier if you want
            if len(suggestions) >= 10:
                break
        return jsonify(suggestions)

    except Exception as e:
        print("Suggestion error:", e)
        return jsonify([])

'''