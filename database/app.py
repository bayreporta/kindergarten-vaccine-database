import csv
import json
from flask import Flask
from flask import render_template
import sys

app = Flask(__name__)

## ADDRESS ENCODING ISSUES ##
reload(sys)
sys.setdefaultencoding('utf-8')

## GET CSV ##
def get_csv(path):
	csv_path = path 
	csv_file = open(csv_path, 'rb')
	csv_obj = csv.DictReader(csv_file)
	csv_list = list(csv_obj)
	return csv_list

## INDEX PAGE ##
@app.route('/')
def index():
	template = 'index.html'
	raw_data = get_csv('./static/data.csv')
	return render_template(template)

## DETAIL PAGE ##
def detail(slug):
	template = 'detail.html'
	raw_data = get_csv('./static/data.csv')
	for row in raw_data:
		if row['slug'] == slug:
			return render_template(template, data=row, json=json.dumps(row))
	abort(404)
app.add_url_rule('/<slug>.html','detail', detail)

## SEARCH PAGE ##
@app.route('/search.html')
def search():
	template = 'search.html'
	raw_data = get_csv('./static/data.csv')
	return render_template(template, data=raw_data)

if __name__ == '__main__':
    app.run(debug=True, use_reloader=True)

