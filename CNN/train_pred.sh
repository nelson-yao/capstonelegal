
# ## ************ Data Security      ***********
python cnn_glove_train_pred.py "../Data/sentence_score_conso10_3L_py2.pk" "Data Security" \
"/home/nyao/Embeddings/glove.6B.100d.txt"  --descriptor "CNN_glove" --num-epochs 300 \
--print-every 200 --eval-every 500 --save-every 500 \
--model-name "CNN_glove_trainable"  --embed-trainable

# ## ************  User Choice/Control  ***********

# 3-level data
python cnn_glove_train_pred.py "../Data/sentence_score_conso10_3L_py2.pk" 'User Choice/Control' \
"/home/nyao/Embeddings/glove.6B.100d.txt"  --descriptor "CNN_glove" --num-epochs 350 --print-every 200 \
--eval-every 600  --model-name "CNN_glove_trainable" --filter-size 3 4 5    \
--dropout-keep-prob 0.8 --save-every 600  --embed-trainable


# ## ************  'Data Retention'  ***********
python cnn_glove_train_pred.py "../Data/sentence_score_conso10_3L_py2.pk" 'Data Retention' \
 "/home/nyao/Embeddings/glove.6B.100d.txt"  --descriptor "CNN_glove" --num-epochs 400 --print-every 200 \
--eval-every 600  --model-name "CNN_glove_trainable" --filter-size 3 4 5    \
--dropout-keep-prob 0.8 --save-every 600  --embed-trainable


# ## ********* Do Not Track     ***************

python cnn_glove_train_pred.py "../Data/sentence_score_conso10_3L_py2.pk" 'Do Not Track' \
 "/home/nyao/Embeddings/glove.6B.100d.txt"  --descriptor "CNN_glove" --num-epochs 400 --print-every 200 \
--eval-every 600  --model-name "CNN_glove" --filter-size 3 4 5    \
--dropout-keep-prob 0.8 --save-every 600

# ## ********* 'First Party Collection/Use'    ***************

python cnn_glove_train_pred.py "../Data/sentence_score_conso10_3L_py2.pk" 'First Party Collection/Use' \
 "/home/nyao/Embeddings/glove.6B.100d.txt"  --descriptor "CNN_glove_3L" --num-epochs 350 --print-every 200 \
--eval-every 600  --model-name "CNN_glove" --filter-size 3 4 5    \
--dropout-keep-prob 0.8 --save-every 600

# ## ********* 'Policy Change'    ***************

# python cnn_glove_train.py "../Data/sentence_score_conso10_3L_py2.pk" 'Policy Change' \
#  "/home/nyao/Embeddings/glove.6B.100d.txt"  --descriptor "CNN_glove_3L" --num-epochs 500 --print-every 200 \
# --eval-every 600  --model-name "CNN_glove" --filter-size 3 4 5    \
# --dropout-keep-prob 0.8 --save-every 600


# ## ********* 'Third Party Sharing/Collection'    ***************

# python cnn_glove_train.py "../Data/sentence_score_conso10_3L_py2.pk" 'Third Party Sharing/Collection' \
#  "/home/nyao/Embeddings/glove.6B.100d.txt"  --descriptor "CNN_glove_3L_trainable" --num-epochs 500 --print-every 200 \
# --eval-every 600  --model-name "CNN_glove_trainable" --filter-size 3 4 5    \
# --dropout-keep-prob 0.8 --save-every 600

# ## ********* 'User Access, Edit and Deletion'    ***************
python cnn_glove_train_pred.py "../Data/sentence_score_conso10_3L_py2.pk" 'User Access, Edit and Deletion' \
 "/home/nyao/Embeddings/glove.6B.100d.txt"  --descriptor "CNN_glove_3L" --num-epochs 300 --print-every 200 --eval-every 600  --model-name "CNN_glove" --filter-size 3 4 5    \
--dropout-keep-prob 0.8 --save-every 600
