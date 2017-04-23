from __future__ import division
import tensorflow as tf
import cPickle
import argparse
import numpy as np
import os
import time
import datetime
import data_helpers
from tensorflow.contrib import learn
from sklearn.metrics import f1_score
from cnn_net_glove import CNN
import cnn_helpers
from sklearn.metrics import average_precision_score
import logging
import json
import sys
from sklearn import metrics
import json
timestamp = str(int(time.time()))

parser=argparse.ArgumentParser(description="Arguments for CNN training")
parser.add_argument("InputData", help="Path to the input pickle file", action="store")
parser.add_argument("Category", help="Name of the category to focus on")
parser.add_argument("embedding_File", default=None, action="store",help="Path to the embedding file")

parser.add_argument("--train-proportion",default=0.85, type=float, dest="train_proportion", help="Proportion of the data to be used as training set, the rest is used as development set, default is 0.85")
parser.add_argument("--filter-size", type=int, default=[3,4,5],dest="filter_sizes", nargs="+",help="Sizes of the filters, can specify mutiple sizes for multiple channels. Default is [2,3,5]")
parser.add_argument("--model-name", default="CNN", dest="model_name", help="Name the model, this will be the folder name under which everything is saved. Default is \"CNN\" followed by category code and timestamp")
parser.add_argument("--num-filters", default=100, dest="num_filters", help="Number of filters per channel, default 100")
parser.add_argument("--dropout-keep-prob", default=0.5, dest="dropout_keep_prob",type=float, help="Drop out keep probability, default 0.5")
parser.add_argument("--l2", default=1.0, type=float, dest="l2", help="L2 regularization parameter, default 1.0")
parser.add_argument("--batch-size", default=100, type=int, dest="batch_size", help="Batch size, default 100")
parser.add_argument("--num-epochs", default=100, type=int, dest="num_epoch", help="Number of epochs, default 100")
parser.add_argument("--print-every", default=100, type=int, dest="print_every", help="Print after how many steps, default is 100")
parser.add_argument("--save-every", default=500, type=int, dest="save_every", help="Save a checkpoint after every N steps, default is 500. A final checkpoint will also be saved after training is finished")
parser.add_argument("--eval-every", default=500, type=int, dest="eval_every", help="Evalute the model after every N steps, default is 500")
parser.add_argument("--descriptor", default="CNN", dest="descriptor", help="A short descriptor for the model, will be used in the pace records")
parser.add_argument("--embed-trainable", default=False,action="store_true", dest="trainable", help="use this flag to make the word embeddings trainable")


args=parser.parse_args()

InputData=args.InputData
Category=args.Category  # category to focus on
train_proportion=args.train_proportion

categoryCode={'Data Retention':"DR", 'Data Security':"DS",
              'Do Not Track':"DNT", 'First Party Collection/Use':"FP", 'International and Specific Audiences':"INT",
              'Not_used':"NU", 'Policy Change':"PC", 'Third Party Sharing/Collection':"TP",
              'User Access, Edit and Deletion':"UA",'User Choice/Control':"UC"}

#CNN  paramters

embeddingFile=args.embedding_File  ## path to the embedding file
FS = args.filter_sizes #Filter Sizes
Num_F = args.num_filters  #Number of filters per filter size
dropout_keep_prob = args.dropout_keep_prob
L = args.l2
batch_size = args.batch_size
num_epoch = args.num_epoch
print_every=args.print_every
save_every=args.save_every
eval_every=args.eval_every

trainable=args.trainable  # are embeddings trainable?
# naming
try:
    catCode=categoryCode[Category]
except KeyError:
    print("Input category does not exist")
    sys.exit()
#
model_name=args.model_name+"_"+catCode+"_"+timestamp[-4::]

descriptor=args.descriptor
## define logging control

if embeddingFile is None:
    print("No embedding file found, please enter the path")
    embeddingFile=input("Enter full path to embedding file : ")

out_dir = os.path.abspath(os.path.join(os.path.curdir, "runs", model_name))

if not os.path.exists(out_dir):
    os.makedirs(out_dir)

logger = logging.getLogger(model_name)
logger.setLevel(logging.DEBUG)
fh = logging.FileHandler(os.path.join(out_dir, model_name+".log"))
fh.setLevel(logging.DEBUG)
ch = logging.StreamHandler(sys.stdout)
ch.setLevel(logging.INFO)
formatter1 = logging.Formatter('%(asctime)s %(levelname)s : %(message)s')
formatter2 = logging.Formatter('%(asctime)s %(levelname)s : %(message)s')

ch.setFormatter(formatter1)
fh.setFormatter(formatter2)

logger.addHandler(fh)
logger.addHandler(ch)

logger.info("CNN classifier using GloVe embeddings, with AdamOptimizer")
logger.info("Reading data from {}".format(InputData))
logger.info("Training models to predict scores the category of \"{}\" ".format(Category))

logger.info("Filter sizes : {}".format(FS))
logger.info("Number of filters : {}" .format(Num_F))
logger.info("Dropout keep probability : {}" .format(dropout_keep_prob))
logger.info("L2 regularization constant : {}" .format(L))
logger.info("Batch size : {}" .format(batch_size))
logger.info("Number of epochs : {}".format(num_epoch))


with open(InputData, 'rb') as f:
    data=cPickle.load(f)

## Generate training data
logger.info("Preparing data and embeddings")
train_x, dev_x, train_y, dev_y, embeddings, processor=cnn_helpers.processGlove(data,Category , train_proportion, embeddingFile, minscore=-1, maxscore=1)
vocabsize=len(processor.vocabulary_)
M=embeddings.shape[1]   # embedding size

logger.info("Embedding matrix shape : {}".format(embeddings.shape))
logger.info("Vocabulary size : {}".format(vocabsize))
logger.info("Training sample size : {}".format(train_x.shape[0]))
logger.info("Development sample size : {}".format(dev_x.shape[0]))
logger.info("Number of classes : {}".format(train_y.shape[1]))
logger.info("Training Label Distribution : {}".format(list(np.sum(train_y, axis=0))))

totalsteps=(int(train_x.shape[0]/batch_size)+1)*num_epoch

processorfile=os.path.join(out_dir, model_name+"_vocab.pk")

logger.info("Saving vocabulary processor to {}".format(processorfile))
with open(processorfile, "wb") as fv:
    cPickle.dump(processor, fv)

with tf.Graph().as_default():

    sess = tf.Session()
    with sess.as_default():
        cnn = CNN(
            sequence_length=train_x.shape[1],
            num_classes=train_y.shape[1],
            vocab_size=vocabsize,
            embedding_size = M,
            filter_sizes = FS,
            num_filters = Num_F,
            embed_trainable=trainable,
            l2_reg_lambda = L)

        # Define Training procedure
        global_step = tf.Variable(0, name="global_step", trainable=False)

        optimizer = tf.train.AdamOptimizer(1e-3)

        # AdamOptimizer achieves much better results than Adadelta
        #optimizer = tf.train.AdadeltaOptimizer(0.001)

        grads_and_vars = optimizer.compute_gradients(cnn.loss)
        train_op = optimizer.apply_gradients(grads_and_vars, global_step=global_step)

        # Summaries for loss and accuracy
        loss_summary = tf.summary.scalar("loss", cnn.loss)
        acc_summary = tf.summary.scalar("accuracy", cnn.accuracy)

        # Output directory for checkpoints and summaries

        logger.info("Writing to {}\n".format(out_dir))

        # Train Summaries

        train_summary_dir = os.path.join(out_dir, "summaries", "train")
        train_summary_writer = tf.summary.FileWriter(train_summary_dir, sess.graph)

        # Checkpoint directory. Tensorflow assumes this directory already exists so we need to create it
        checkpoint_dir = os.path.abspath(os.path.join(out_dir, "checkpoints"))
        checkpoint_prefix = os.path.join(checkpoint_dir, "model")
        if not os.path.exists(checkpoint_dir):
            os.makedirs(checkpoint_dir)
        init_op=tf.global_variables_initializer()
        saver = tf.train.Saver()

        # Initialize all variables
        sess.run(init_op)
        # feed the embedding matrix
        sess.run(cnn.embedding_init, feed_dict={cnn.embedding_placeholder: embeddings})

        def train_step(x_batch, y_batch, printevery, logger=logger):
            """
            A single training step
            """
            feed_dict = {
              cnn.input_x: x_batch,
              cnn.input_y: y_batch,

              cnn.dropout_keep_prob: dropout_keep_prob
            }
            _, step,loss, accuracy = sess.run(
                [train_op, global_step, cnn.loss, cnn.accuracy],
                feed_dict)
            time_str = datetime.datetime.now().isoformat()
            if step % printevery == 0:
                logger.info("step {} / {}, loss {:g}, acc {:g}".format( step, int(totalsteps), loss, accuracy))


        def dev_step(x_batch_dev, y_batch_dev, logger=logger):
            """
            Evaluates model on a dev set
            """

            print("\nDev Set Evaluation:")
            feed_dict = {
              cnn.input_x: x_batch_dev,
              cnn.input_y: y_batch_dev,
              cnn.dropout_keep_prob: dropout_keep_prob
            }
            step, loss, scores,prediction = sess.run(
                [global_step, cnn.loss,cnn.xw_out, cnn.predictions],
                feed_dict)
            truth = y_batch_dev.argmax(axis=1)
            f1=f1_score(truth, prediction, average='micro')
            precision = metrics.precision_score(truth, prediction, average="weighted")
            recall = metrics.recall_score(truth, prediction, average="weighted")
            time_str = datetime.datetime.now().isoformat()
            logger.info("step {} / {}, loss {:g}, dev precision: {}, recall: {},  f1-score: {}".format(step,int(totalsteps), loss, precision, recall, f1))
            return precision, recall, f1

        def save_performance(precision, recall, f1score, epochnum):
            performance={}
            performance["Embedding size"]=M
            performance["Filter number"]=Num_F
            performance["Filter sizes"]=",".join([str(x) for x in FS])
            performance["Dropout keep probability"]=dropout_keep_prob
            performance["Regularization"]=L
            performance["Batch size"]=batch_size
            performance["Development f1"]=f1score
            performance["Model Type"]=descriptor
            performance["Model Name"]=model_name
            performance["Trainable Embedding"]=trainable
            performance["Epoch Number"]=float("{:.1f}".format(epochnum))
            performance["Category"]=Category
            performance["Precision"] = precision
            performance["Recall"] = recall
            performancefile=os.path.join(out_dir, model_name+"_performance.json")
            logger.info("Saving performances to {}".format(performancefile))
            with open(performancefile, "w") as fp:
                json.dump(performance, fp)

        # Generating batches
        batches = cnn_helpers.batch_iter(
            train_x, train_y, batch_size, num_epoch)

        # Training executions
        devbatches=cnn_helpers.batch_iter(dev_x, dev_y, 100, 1)
        for batch in batches:
            x_batch, y_batch = zip(*batch)
            train_step(x_batch, y_batch, printevery=print_every)

            current_step = tf.train.global_step(sess, global_step)
            current_epoch=current_step*batch_size/train_x.shape[0]
            if current_step % eval_every == 0:
                logger.info("Epoch Number : {}".format(current_epoch) )
                dev_precision, dev_recall, dev_f1=dev_step(dev_x, dev_y)

            if current_step % save_every==0:

                logger.info("Saving checkpoint to {}/model_{}.ckpt".format(checkpoint_dir, current_step))
                save_path = saver.save(sess, "{}/model{}.ckpt".format(checkpoint_dir, current_step))
                save_performance(dev_precision, dev_recall, dev_f1, current_epoch)


        logger.info("Training finished")
        current_step = tf.train.global_step(sess, global_step)
        current_epoch=current_step*batch_size/train_x.shape[0]
        logger.info("Epoch Number : {}".format(int(current_epoch)) )
        dev_precision, dev_recall, dev_f1=dev_step(dev_x, dev_y)
        logger.info("Saving checkpoint to {}/model_{}.ckpt".format(checkpoint_dir, current_step))
        save_path = saver.save(sess, "{}/model_{}.ckpt".format(checkpoint_dir, current_step))
        save_performance(dev_precision, dev_recall, dev_f1, current_epoch)

        logger.info("Scoring new sentences for the category "+Category)
        with open("../Data/corpus_sentences_py2.pk", 'rb') as f:
            corpus_sent = cPickle.load(f)
        def getSetencesForCat(corpus, category):
            sentences={}
            for website, collection in corpus.items():
                relevant_setences = collection[category]
                sentences[website]=relevant_setences
            return sentences
        relevantSents = getSetencesForCat(corpus_sent, Category)
        def pred_step(featurelist):
            feed_dict = {
              cnn.input_x: featurelist,
              cnn.dropout_keep_prob: dropout_keep_prob
            }
            step, prediction = sess.run(
                [global_step, cnn.predictions],
                feed_dict)
            return prediction
        def pred_sentences(sentence_collection, topic, processor):
            result={topic:{}}
            for website, sentenceList in sentence_collection.items():
                if len(sentenceList)>0:
                    featureList=np.array(list(processor.transform(sentenceList)))
                    predictions=pred_step(featureList)
                    result[topic][website]= zip(sentenceList, predictions)
                else:
                    result[topic][website]=[]
            return result

        predictions = pred_sentences(relevantSents, Category, processor)
        prediction_file = os.path.join(out_dir, "Scores_"+catCode+".json")
        with open(prediction_file, "w") as f:
            json.dump(predictions, f)
