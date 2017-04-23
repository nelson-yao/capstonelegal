#!/home/nyao/tfpy2/bin/python

##  WORD EMBEDDINGS - GloVe
#  Generates a word embedding based on the pretrained corpora
#     Mar, 2017

import numpy as np
from nltk.corpus import stopwords
from os.path import abspath
from glob import glob



def list_corpora():
    """Lists the corpora available"""
    __path = abspath('.')
    __pos = __path.index('MIDS-W266-Final-MSY')
    PATH_TO_CORPORA = __path[:__pos + 19] + '/data/geom_corpora/'
    non_zips = filter( lambda x: not (x.endswith('.zip') or x.endswith('.gz') or x.endswith('.md')), glob(PATH_TO_CORPORA + '*') )
    return map(lambda x: x.split('/')[-1], non_zips)


class GloVe(object):
    """Trained object of `GloVe<http://nlp.stanford.edu/projects/glove/>`_ using the `stanfordnlp-trained datasets<http://nlp.stanford.edu/data/wordvecs/>`_"""


    def __init__(self, file_name):
        self.vocab = self.load_model(file_name)
        self.n_dim = self.__getitem__( 'a' ).shape[0]
        self.STOPWORDS=stopwords.words('english')

    def load_model(self, file_name):
        """Loads a given GloVe model"""
        repr_dict = {}  # initialize dictionary

        with open(file_name, 'rb') as f:
            for line in iter(f.readline, ''):
                _terms = line.split()
                repr_dict[_terms[0]] = np.array(map(float, _terms[1:]))

        return repr_dict

    def __getitem__(self, item):
        """Geometric representation of the object"""
        try:
            representation = self.vocab[item]
        except KeyError:
            representation = np.zeros(self.n_dim)
        finally:
            return representation

    def sentence_representation(self, sentence):
        """Returns the 'mean' representation of all the uncommon words in a sentence """
        representation = 0.

        # Get list of `uncommon` words
        words = [ w for w in sentence.lower().split() if w not in self.STOPWORDS ]

        if words:
            for w in words:
                representation += self.__getitem__( w.strip() )

            representation /= len(words)
        # If no words were specified
        else:
            representation = self.vocab['<unk>']

        return representation


    # NOTE: research other aggregation methods (other than mean)
    def __call__(self, text_list, doc_length):
        """Geometric representation of a document (document will be censored of padded to match length)"""

        pad_length = doc_length - len(text_list)

        # obtain each sentences representation
        sent_reps = np.vstack( [ self.sentence_representation(s) for s in text_list[:doc_length] ] )

        # add padding if necessary
        if pad_length > 0:

            embedding=np.concatenate([ sent_reps ,[np.zeros(self.n_dim)] * pad_length])

        # return stacked representations
        return embedding
