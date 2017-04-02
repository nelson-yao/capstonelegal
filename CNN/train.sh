# python cnn_glove_train.py "../Data/sentence_score_conso10_py2.pk" "Data Security" \
# "/home/nyao/Embeddings/glove.6B.100d.txt"  --descriptor "CNN_glove" --num-epochs 100 --print-every 50 --eval-every 100 \
# --model-name "CNN_glove_Adam_"

python cnn_glove_train.py "../Data/sentence_score_conso10_py2.pk" 'User Choice/Control' \
"/home/nyao/Embeddings/glove.6B.100d.txt"  --descriptor "CNN_glove" --num-epochs 500 --print-every 200 \
--eval-every 600  --model-name "CNN_glove" --filter-size 3 4 5  --dropout-keep-prob 0.8 --save-every 600
    
python cnn_glove_train.py "../Data/sentence_score_conso10_py2.pk" 'User Choice/Control' \
"/home/nyao/Embeddings/glove.6B.100d.txt"  --descriptor "CNN_glove" --num-epochs 500 --print-every 200 \
--eval-every 600  --model-name "CNN_glove" --filter-size 2 3 4 5   --dropout-keep-prob 0.8 --save-every 600