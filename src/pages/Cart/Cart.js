import { StatusBar } from 'expo-status-bar';
import { Text, View, SafeAreaView, FlatList, TouchableOpacity,Alert} from 'react-native';
import { useState,useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';


import { Load } from '../../components/Load';
import { CartEmpty } from '../../components/CartEmpty';
import { CartProduct } from '../../components/CartProduct';
import { styles } from './Styles';
import { api } from '../../config';

export const Cart = ({navigation}) => {

  const [cartData, setCartData] = useState([]);
  const [dataProducts, setDataProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);

  const clear = ()=>{
    AsyncStorage.clear(), 
    setDataProducts([]),
    setEmpty(true)
  }

  const clearAll = async()=>{
    Alert.alert(
      '',
      'Deseja limpar tudo?', 
      [
        {text: 'Não'},
        {text: 'Sim', onPress: clear},
      ],
      {cancelable: false},
    )
    
  }

  const headlePursh = () =>{
    getData();
    let val = 0;
    if (dataProducts.length>=1){
      const data = JSON.stringify(dataProducts)
      const v = JSON.parse(data)
      for(let i=0;i<dataProducts.length;i++){
        val+=v[i].price*v[i].quantity
        const va = val
        navigation.navigate("AdressAndPayment", {valor:va})
        }
    }
  }

  const isEmpty = async () => {
    const response = await AsyncStorage.getItem('cart');
    const savedItems = JSON.parse(response);
    if (savedItems.length <= 0) {
      clear();
    }
      
  }

  const less = (id, setQuant) => {
    AsyncStorage.getItem('cart')
      .then(res => {
        let savedItems = JSON.parse(res);
        let item = savedItems.find(i => i.id === id)
        const qtt = item.qtd -= 1;
        setQuant(qtt);
        if (qtt <= 0) {
          savedItems = savedItems.filter(i => i.id !== id);
        }
        AsyncStorage.setItem('cart', JSON.stringify(savedItems));
        isEmpty();
      });
  }

  const more = (id, setQuant) => {
    AsyncStorage.getItem('cart')
      .then(res => {
        let savedItems = JSON.parse(res);
        let item = savedItems.find(i => i.id === id)
        setQuant(item.qtd += 1);
        AsyncStorage.setItem('cart', JSON.stringify(savedItems));
      });
  }

  const getData = async() => {
    try {
      const response = await AsyncStorage.getItem('cart');
      setDataProducts([]);

      if(response) {
        const value = JSON.parse(response);
        setCartData(value)
        
      }
      if(response===null){
        setEmpty(true)
      }

    } catch (e) {
      alert('Falha ao capturar os produtos!');
    }
  };

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    let url = 'items?ids=';
    cartData.map((item, index) => {
      index < 1 ? url += item.id : url += ','+item.id
    })
    
    api.get(url)
      .then(({ data }) => {
        setLoading(true)
        data.map((res) => {
          setDataProducts(dataProducts => [...dataProducts, {
            id: res.body.id,
            title: res.body.title,
            thumbnail: res.body.thumbnail,
            price: res.body.price,
            quantity: cartData.find(p => p.id === res.body.id).qtd
          }])
        })
      })
      .catch((er) => {
        setLoading(true)
        setDataProducts([]);
      });

    }, [cartData]);

  const renderItem = ({ item }) => (
    <CartProduct
      id={item.id}
      title={item.title}
      thumbnail={item.thumbnail}
      price={item.price}
      quantity={item.quantity}
      less={less}
      more={more}
    />
  );

  return (

   
    <View style={{flex:1}}>
      <StatusBar
        style = "auto"
        hidden = {false}
        backgroundColor = "rgb(3,147,213)"
        translucent = {false}
        networkActivityIndicatorVisible = {true}
      />
      {(dataProducts.length<=0 && loading && !empty) && <Load/>}
      {(dataProducts.length<=0 && empty)?<CartEmpty/>:
                <View style={styles.container}>
                  <SafeAreaView style={styles.content}>
                      <FlatList
                          data={dataProducts}
                          keyExtractor={(item) => item.id}
                          renderItem={renderItem}
                      />
                  </SafeAreaView>

                  <TouchableOpacity style={styles.buttonClear} onPress={clearAll}>
                    <Text style={styles.titleBuy}>Limpar Tudo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.buttonBuy} onPress={headlePursh}>
                    <Text style={styles.titleBuy}>Continuar Compra</Text>
                  </TouchableOpacity>
                </View>
      }
    </View>
  );
}