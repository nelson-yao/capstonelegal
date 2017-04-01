import pandas as pd
import re
import numpy as np
from tensorflow.contrib import learn
from glove import GloVe

def clean_str(string):
    
    """
    Tokenization/string cleaning for all datasets except for SST.
    Original taken from https://github.com/yoonkim/CNN_sentence/blob/master/process_data.py
    """
    #string = re.sub(r"e-mail", "email", string)
    string = re.sub(r"[^A-Za-z0-9(),!?\'\`]", " ", string)
    string = re.sub(r"\'s", " \'s", string)
    string = re.sub(r"\'ve", " \'ve", string)
    string = re.sub(r"n\'t", " n\'t", string)
    string = re.sub(r"\'re", " \'re", string)
    string = re.sub(r"\'d", " \'d", string)
    string = re.sub(r"\'ll", " \'ll", string)
    string = re.sub(r",", " , ", string)
    string = re.sub(r"!", " ! ", string)
    string = re.sub(r"\(", " \( ", string)
    string = re.sub(r"\)", " \) ", string)
    string = re.sub(r"\?", " \? ", string)
    string = re.sub(r"\s{2,}", " ", string)
    string = re.sub(r":", " ", string)
    
    return string.strip().lower()

def padSentence(wordlist, maximumLength, pad="<PAD>"):
    paddedList=wordlist+[pad]*(maximumLength-len(wordlist))
    return " ".join(paddedList)


def processWord(scoretable, category, trainproportion, seed=120, minscore=-2, maxscore=2):
    """Turns sentences to lists of word indices, padded to maximum sentence length in the corpus.
    Use tf.contrib.learn.VocabProcessor to generate word indices and paddings
    Process all the words first, then split the data into training and development
    """
    
    # Assuming the input label is a one-dimensional discrete-valued array
    # trainportion means the percentage of data to be used as training, the rest are used as validation
    # choose a category, get the data from the data file
    np.random.seed(seed)
    categoryFrame=scoretable[["Sentence", category]]
    nonmissing=categoryFrame.dropna()
    
    ## equal portion sampling, sample from both positive and negative group
    #shufflednonmissing=nonmissing.sample(frac=1, random_state=seed)   # shuffle the data 
    
    nonmissingNumber=nonmissing.shape[0]

    texts=nonmissing["Sentence"].tolist()
    max_length = max([len(x.split(" ")) for x in texts])
    cleantexts=[clean_str(sent) for sent in texts]
    
    processor = learn.preprocessing.VocabularyProcessor(max_length)
    features=np.array(list(processor.fit_transform(cleantexts)))
    
    labels=nonmissing[category].tolist()
    
    nlevels=maxscore-minscore+1

    correction=minscore
    
    labelsOneHot=np.zeros((len(labels), nlevels))
    labelsOneHot[range(len(labels)), [int(x-correction) for x in labels]]=1
    
    train_index=int(nonmissingNumber*trainproportion)
    random_indices=np.random.permutation(range(nonmissingNumber))
    
    shuffledFeatures=features[random_indices]
    shuffledLabels=labelsOneHot[random_indices]
    
    trainFeatures=shuffledFeatures[0:train_index]
    devFeatures=shuffledFeatures[train_index+1::]
    
    trainLabels=shuffledLabels[0:train_index]
    devLabels=shuffledLabels[train_index+1::]
    
    assert trainFeatures.shape[0]==trainLabels.shape[0], "Number of training features and labels don't match"
    assert devFeatures.shape[0]==devLabels.shape[0], "Number of development features and labels don't match"
    vocabsize=len(processor.vocabulary_)
    return trainFeatures, devFeatures, trainLabels, devLabels, processor
    
    
def processGlove(scoretable, category, trainproportion, gloveFile, seed=120, minscore=-2, maxscore=2):
    """
    generates training features and labels, and a GloVe embedding in the form of a numpy array
    glove is a GloVe object, defined in glove.py
    """
    
    # Assuming the input label is a one-dimensional discrete-valued array
    # trainportion means the percentage of data to be used as training, the rest are used as validation
    # choose a category, get the data from the data file
    np.random.seed(seed)
    categoryFrame=scoretable[["Sentence", category]]
    nonmissing=categoryFrame.dropna()
    
    ## equal portion sampling, sample from both positive and negative group
    #shufflednonmissing=nonmissing.sample(frac=1, random_state=seed)   # shuffle the data 
    
    nonmissingNumber=nonmissing.shape[0]

    texts=nonmissing["Sentence"].tolist()
    max_length = max([len(x.split(" ")) for x in texts])
    cleantexts=[clean_str(sent) for sent in texts]
    
    processor = learn.preprocessing.VocabularyProcessor(max_length)
    features=np.array(list(processor.fit_transform(cleantexts)))
    vocabsize=len(processor.vocabulary_)
    
    ## make an embedding matrix
    glove=GloVe(gloveFile)
    embeddings=np.zeros((vocabsize, glove.n_dim))
    mappings=processor.vocabulary_._mapping
    
    for word, index in mappings.items():
        embeddings[index]=glove[word]
    
    
    ## Generate one-hot labels
    labels=nonmissing[category].tolist()
    nlevels=maxscore-minscore+1
    correction=minscore
    
    labelsOneHot=np.zeros((len(labels), nlevels))
    labelsOneHot[range(len(labels)), [int(x-correction) for x in labels]]=1
    
    train_index=int(nonmissingNumber*trainproportion)
    random_indices=np.random.permutation(range(nonmissingNumber))
    
    shuffledFeatures=features[random_indices]
    shuffledLabels=labelsOneHot[random_indices]
    
    trainFeatures=shuffledFeatures[0:train_index]
    devFeatures=shuffledFeatures[train_index+1::]
    
    trainLabels=shuffledLabels[0:train_index]
    devLabels=shuffledLabels[train_index+1::]
    
    assert trainFeatures.shape[0]==trainLabels.shape[0], "Number of training features and labels don't match"
    assert devFeatures.shape[0]==devLabels.shape[0], "Number of development features and labels don't match"
    
    return trainFeatures, devFeatures, trainLabels, devLabels, embeddings, processor
    
def batch_iter(train, label, batch_size, num_epochs, shuffle=True):
    """
    Generates a batch iterator for a dataset.
    """

    data = np.array(list(zip(train, label)))
    data_size = len(data)
    num_batches_per_epoch = int((len(data)-1)/batch_size) + 1
    for epoch in range(num_epochs):
        # Shuffle the data at each epoch
        if shuffle:
            shuffle_indices = np.random.permutation(np.arange(data_size))
            shuffled_data = data[shuffle_indices]
        else:
            shuffled_data = data
        for batch_num in range(num_batches_per_epoch):
            start_index = batch_num * batch_size
            end_index = min((batch_num + 1) * batch_size, data_size)
            yield shuffled_data[start_index:end_index]

if __name__=="__main__":
    pass