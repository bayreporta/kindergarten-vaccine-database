from flask_frozen import Freezer
from app import app, get_csv
freezer = Freezer(app)

@freezer.register_generator
def detail():
	for row in get_csv('./static/data.csv'):
		yield {'entity_slug': row['entity_slug']}

@freezer.register_generator
def charter():
	for row in get_csv('./static/charter.csv'):
		yield {'slug': row['slug']}


if __name__ == '__main__':
	freezer.freeze()