"""Build the checked-in OpenAPI contract. Run npm run api:types after changing it."""
import json
S={}
def obj(name,fields,required=None):
 S[name]={'type':'object','additionalProperties':False,'properties':fields,'required':required if required is not None else list(fields)}
def ref(name):return {'$ref':'#/components/schemas/'+name}
def arr(name):return {'type':'array','items':ref(name)}
string={'type':'string'};integer={'type':'integer'};money={'type':'integer','format':'int64','minimum':0};boolean={'type':'boolean'};timestamp={'type':'string','format':'date-time'}
obj('Error',{'error':{'type':'object','required':['code','message','request_id'],'properties':{'code':string,'message':string,'request_id':string}}})
obj('Session',{'csrf':string,'admin':boolean})
obj('Variant',{'id':string,'sku':string,'name':string,'units':integer,'price_rial':money,'available':integer,'active':boolean})
obj('Product',{'id':string,'name':string,'description':string,'asset':string,'variants':arr('Variant')})
obj('CartItem',{'variant_id':string,'product_name':string,'variant_name':string,'asset':string,'quantity':integer,'unit_price_rial':money})
obj('Cart',{'items':arr('CartItem'),'total_rial':money})
obj('OrderItem',{'variant_id':string,'product_name':string,'variant_name':string,'sku':string,'quantity':integer,'unit_price_rial':money})
obj('PaymentAttempt',{'id':string,'scenario':{'type':'string','enum':['success','failure','cancel']},'status':{'type':'string','enum':['succeeded','failed','cancelled']},'created_at':timestamp})
obj('Order',{'id':string,'status':{'type':'string','enum':['pending','paid','processing','shipped','cancelled','expired']},'total_rial':money,'created_at':timestamp,'expires_at':timestamp,'items':arr('OrderItem'),'payments':arr('PaymentAttempt')})
obj('Inventory',{'warehouse_id':string,'warehouse_name':string,'variant_id':string,'product_name':string,'variant_name':string,'sku':string,'on_hand':integer,'reserved':integer,'available':integer})
obj('Warehouse',{'id':string,'name':string})
obj('Movement',{'id':integer,'warehouse':string,'sku':string,'delta':integer,'reason':string,'created_at':timestamp})
obj('Audit',{'id':integer,'actor':string,'action':string,'entity_id':string,'detail':string,'created_at':timestamp})
obj('OK',{'ok':boolean})
obj('LoginInput',{'username':{'type':'string','maxLength':80},'password':{'type':'string','minLength':1,'maxLength':72}})
obj('CartInput',{'variant_id':{'type':'string','maxLength':80},'quantity':{'type':'integer','minimum':0,'maximum':24}})
key={'type':'string','minLength':8,'maxLength':100}
obj('CheckoutInput',{'idempotency_key':key})
obj('PaymentInput',{'idempotency_key':key,'scenario':{'type':'string','enum':['success','failure','cancel']}})
obj('AdjustmentInput',{'warehouse_id':string,'variant_id':string,'delta':{'type':'integer','minimum':-10000,'maximum':10000},'reason':{'type':'string','minLength':3,'maxLength':500}})
obj('WarehouseInput',{'name':{'type':'string','minLength':3,'maxLength':100}})
obj('OrderStatusInput',{'status':{'type':'string','enum':['processing','shipped']}})
obj('VariantInput',{'name':{'type':'string','minLength':2,'maxLength':160},'price_rial':{'type':'integer','format':'int64','minimum':10,'maximum':1000000000,'multipleOf':10},'active':boolean})
paths={}
def route(path,method,response,body=None,many=False,public=False,paginated=False,created=False):
 op={'operationId':method+'_'+path.replace('/','_').replace('{','').replace('}',''),'summary':path,'responses':{str(201 if created else 200):{'description':'Success','content':{'application/json':{'schema':arr(response) if many else ref(response)}}},'default':{'description':'Request failed','content':{'application/json':{'schema':ref('Error')}}}},'security':[] if public else [{'sessionCookie':[]}],'parameters':[]}
 if '{id}' in path:op['parameters'].append({'name':'id','in':'path','required':True,'schema':string})
 if paginated:
  for n,d,m in [('limit',20,100),('offset',0,100000)]:op['parameters'].append({'name':n,'in':'query','schema':{'type':'integer','default':d,'minimum':1 if n=='limit' else 0,'maximum':m}})
 if method not in ['get']:
  op['parameters'] += [{'name':'X-CSRF-Token','in':'header','required':True,'schema':string},{'name':'Origin','in':'header','required':True,'schema':string}]
 if body:op['requestBody']={'required':True,'content':{'application/json':{'schema':ref(body)}}}
 paths.setdefault('/api/v1/'+path,{})[method]=op
route('session','get','Session',public=True)
route('catalog','get','Product',many=True,public=True)
route('login','post','Session','LoginInput')
route('logout','post','Session')
route('cart','get','Cart');route('cart/items','put','Cart','CartInput')
route('checkout','post','Order','CheckoutInput')
route('orders','get','Order',many=True,paginated=True);route('orders/{id}','get','Order')
route('orders/{id}/payments','post','Order','PaymentInput')
route('admin/catalog','get','Product',many=True)
route('admin/inventory','get','Inventory',many=True);route('admin/inventory','post','OK','AdjustmentInput')
route('admin/warehouses','get','Warehouse',many=True);route('admin/warehouses','post','Warehouse','WarehouseInput',created=True)
route('admin/orders','get','Order',many=True,paginated=True);route('admin/orders/{id}','patch','Order','OrderStatusInput')
route('admin/variants/{id}','patch','OK','VariantInput')
route('admin/movements','get','Movement',many=True,paginated=True);route('admin/audit','get','Audit',many=True,paginated=True)
# Browsers supply Origin and middleware supplies CSRF. Optional in generated client, required at runtime.
for path in paths.values():
 for op in path.values():
  for p in op['parameters']:
   if p['in']=='header':p['required']=False
contract={'openapi':'3.0.3','info':{'title':'Behnosh Commerce API','version':'1.0.0','description':'All money is integer IRR. All mutations require exact APP_ORIGIN and session X-CSRF-Token. Admin paths require server-side admin role. Offset pagination defaults to 20 (max 100). Payment is simulated only.'},'servers':[{'url':'/'}],'paths':paths,'components':{'schemas':S,'securitySchemes':{'sessionCookie':{'type':'apiKey','in':'cookie','name':'behnosh_session'}}}}
open('api/openapi.json','w').write(json.dumps(contract,ensure_ascii=False,indent=2)+'\n')
