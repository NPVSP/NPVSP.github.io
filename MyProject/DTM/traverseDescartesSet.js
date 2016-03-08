//不确定数目的笛卡尔集
function traverseDescartesSet(dc,opr)
{
		var c=new Array();
		var i;
		for(i=0;i<dc.length;i++)c.push(0);
		while(1){
				if(opr(c)==0)return 0;
				var k;
				for(k=0;k<dc.length;k++){
						c[k]++;
						if(c[k]!=dc[k]){
								break;
						}else{
								c[k]=0;
						}
				}
				if(k==dc.length){
						return 1;
				}
		}
}